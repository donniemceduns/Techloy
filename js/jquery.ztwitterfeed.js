/**
 * Plugin: jquery.zTwitterFeed
 * 
 * Version: 1.1.1
 * (c) Copyright 2011-2012, Zazar Ltd
 * 
 * Description: jQuery plugin for display of Twitter tweets
 *              (Based on original plugin twit by Yusuke Horie)
 * 
 * History:
 * 1.1.1 - Added callback function
 *         Added showerror option
 *         Code tidy up
 * 1.1.0 - Corrected lapsed time error
 *         Change status url to api
 *         Added include SSL, retweet & exclude replies options
 * 1.0.2 - Fixed issue with hiding header
 * 1.0.1 - Corrected issue with multiple instances
 *
 **/

(function($){
	
	$.fn.twitterfeed = function(username, options, fn) {	
	
		// Set pluign defaults
		var defaults = {
			limit: 10,
			header: true,
			tweeticon: true,
			tweetname: true,
			tweettime: true,
			retweets: true,
			replies: true,
			showerror: true,
			ssl: false
		};  
		var options = $.extend(defaults, options); 
		
		// Functions
		return this.each(function(i, e) {
			var $e = $(e);
			var s = '';
			
			// Add feed class to user div
			if (!$e.hasClass('twitterFeed')) $e.addClass('twitterFeed');
			
			// Check for valid user name
			if (username == null) return false;

			// Check limit does not exceed max
			if (options.limit > 200) options.limit = 200;

			// Check for SSL protocol
			if (options.ssl) s = 's';

			// Reverse replies option
			if (options.replies == true) { options.replies = false; } else { options.replies = true; }

			// Define Twitter feed request
			var url = 'http'+ s +'://api.twitter.com/1/statuses/user_timeline.json?include_rts='+ options.retweets +'&exclude_replies='+ options.replies +'&screen_name='+ username +'&count='+ options.limit;
			var params = {};

			params.count = options.limit;

			// Send request
			$.ajax({
				url: url,
				data: params,
				dataType: 'jsonp',
				success: function (data) {

					// Create feed items
					_process(e, data, options);

					// Optional user callback function
					if ($.isFunction(fn)) fn.call(this,$e);
				},
				error: function(data) {
					if (options.showerror) $e.html('<p>Twitter request failed</p>');
				}
			});
				
			// Function to create HTML result
			var _process = function(e, feeds, options) {
				if (!feeds) {
					return false;
				}
				var html = '';	
				var row = 'odd';
		
				// Add header if required
				if (options.header) {
					var name = feeds[0].user.name;
					var screenname = feeds[0].user.screen_name;
					var icon = feeds[0].user.profile_image_url;
					var link = '<a href="http://twitter.com/' + screenname + '/" title="Visit '+ name +' on Twitter">';

					html +=	'<div style="color:#E10000;" class="twitterHeader">' +
						link + '<img src="'+ icon +'" alt="'+ name +'" /></a>' +
						'<span>'+ link + name + '</a></span>' +
						'</div>';
				}
			
				// Add body
				html += '<div class="twitterBody">' +
					'<ul>';
		
				// Add feeds
				for (var i=0; i<feeds.length; i++) {
			
					// Get individual feed
					if (feeds[i].retweeted_status) {
						var tweet= feeds[i].retweeted_status;
					} else {
						var tweet= feeds[i];
					}
					var link = '<a href="" style="color:#E10000" title="Visit '+ tweet.user.name +' on Twitter">';

					// Add feed row
					html += '<li class="twitterRow '+row+'">';

					// Add user icon if required
					if (options.tweeticon) {
						var icon = tweet.user.profile_image_url;

						html += link + '<img src="'+ icon +'" alt="'+ name +'"  style="margin-top:8px;"></a>';
					}

					// Add user if required
					if (options.tweetname) {
						var name = tweet.user.name;

						html += '<div style="color:#E10000;font-weight:normal;" class="tweetName">'+ link + name +'</a></div>'
					}

					// Add lapsed time if required
					if (options.tweettime) {
						var lapsedTime = _getLapsedTime(tweet.created_at);

						html += '<div class="tweetTime">'+ lapsedTime +'</div>'
					}
			
					// Get tweet text and add links (by Yusuke Horie)
					var text = tweet.text
						.replace(/(https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)/, function (u) {
							var shortUrl = (u.length > 30) ? u.substr(0, 30) + '...': u;
							return '<a style="text-decoration:none;color:#555;" href="' + u + '" title="Click to view this link">' + shortUrl + '</a>';
						})
						.replace(/@([a-zA-Z0-9_]+)/g, '@<a style="text-decoration:none;color:#444;" href="http://twitter.com/$1" title="Click to view $1 on Twitter">$1</a>')
						.replace(/(?:^|\s)#([^\s\.\+:!]+)/g, function (a, u) {
							return ' <a style="text-decoration:none;color:#555;" href="http://twitter.com/search?q=' + encodeURIComponent(u) + '" title="Click to view this on Twitter">#' + u + '</a>';
						});
					html += '<p style="color:#555;">'+ text+'</p>'
					html += '</li>';
			
					// Alternate row classes
					if (row == 'odd') {
						row = 'even';
					} else {
						row = 'odd';
					}			
				}
		
				html += '</ul>' +
					'</div>'
		
				$(e).html(html);
			};

			// Get date as lasped time
			var _getLapsedTime = function(strDate) {
		
				// Reformat Twitter date so that IE can convert
				strDate = Date.parse(strDate.replace(/^([a-z]{3})( [a-z]{3} \d\d?)(.*)( \d{4})$/i, '$1,$2$4$3'));

				// Define current time and format tweet date
				var todayDate = new Date();	
				var tweetDate = new Date(strDate)

				// Get lasped time in seconds
				var lapsedTime = Math.round((todayDate.getTime() - tweetDate.getTime())/1000)

				// Return lasped time in seconds, minutes, hours, days and weeks
				if (lapsedTime < 60) {
					return '< 1m';
				} else if (lapsedTime < (60*60)) {
					return (Math.round(lapsedTime / 60)-1) + 'm';
				} else if (lapsedTime < (24*60*60)) {
					return (Math.round(lapsedTime / 3600)-1) + 'h';
				} else if (lapsedTime < (7*24*60*60)) {
					return (Math.round(lapsedTime / 86400)-1) + 'd';
				} else {
					return (Math.round(lapsedTime / 604800)-1) + 'w';
				}
			};

		});
	};
})(jQuery);