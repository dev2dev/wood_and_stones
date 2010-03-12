var GO = function () {
	var dialog_instance;
	var message_dialog = function (title, text) {
    dialog_instance
			.text(text)
			.dialog({
				title: title,
				buttons: { "Ok": function() { $(this).dialog("close"); } }
			})
			.dialog('open');
	};
	var submit = function(e, success, error) {
	  var $form = (typeof(e)==='string') ? $(e) : $(e.target);
	  $.ajax({
	      url: $form.attr('action'),
	      data: $form.serialize(),
	      type: $form.attr('method') || "POST",
	      success: success,
	      error: error
	  });
	};
	var go = {
		message: message_dialog,
		submit: submit,
		iphone_layout_helper: function () {
			var document_ready_hook = function () {
				dialog_instance = $('<div></div>')
					.dialog({
						autoOpen: false,
						height: 'auto',
						title: 'Hey!'
				});
			};
			return {
				document_ready_hook: document_ready_hook
			}
		},
		game_new_helper: function (info) {
			var assign_gravatar = function (event) {
		    $(this).parents('.email').find('img').replaceWith($.gravatar($(this).val(), {
		        // integer size: between 1 and 512, default 80 (in pixels)
		        size: 40,
		        // maximum rating (in order of raunchiness, least to most): g (default), pg, r, x
		        rating: 'pg',
		        // url to define a default image (can also be one of: identicon, monsterid, wavatar)
		        image: 'monsterid'
		    }));
			};
			var update_emails = function () {
				if ($('form.new_game .you_play :checkbox').attr('checked')) {
					$('form.new_game #black').val($('form.new_game #player').val())
					$('form.new_game #white').val($('form.new_game #opponent').val())
				}
				else {
					$('form.new_game #black').val($('form.new_game #player').val())
					$('form.new_game #white').val($('form.new_game #opponent').val())
				}
			};
			var document_ready_hook = function () {
				$('.email input')
					.each(assign_gravatar)
					.blur(assign_gravatar);
		    $('form.new_game').submit(function (e) {
					update_emails();
					var form = $(e.currentTarget);
				  $.ajax({
				      url: form.attr('action'),
				      data: form.serialize(),
				      type: form.attr('method') || "POST",
							dataType: 'json',
				      success: function (data) { 
								if (data.url) {
							    dialog_instance
										.text("Your opponent has been emailed invitations to the new game. Thanks!")
										.dialog({
											title: "Invitation Sent",
											buttons: { 
												"Play Game": function() { 
													$(this).dialog("close");
													window.location = data.url
												},
												"Ok":   function() { $(this).dialog("close"); } 
											}
										})
										.dialog('open');
								}
								else {
									message_dialog('Invitations Sent', 'You and your opponent have been emailed invitations to the new game. Thanks!');
								}
			        },
				      error: function (data) { 
			          message_dialog('Invalid Invitation', 'Sorry, you cannot start a new game because: ' + data.responseText);
			        }
				  });
		      return false;
		    });
			};
			return {
				document_ready_hook: document_ready_hook
			}
		},
		game_show_helper: function (info) {
			var NULL_SELECTOR = 'not(*)';
			var SELECTION_EVENT = ($.support.touch ? 'tap' : 'click');
			
			info = $.extend({}, info);
			
			var last_displayed_move_number = function () {
				return $('.move:last').data('number');
			};

			var select_move_by_move_number = function (move_number) {
			  return '#m' + move_number;
			};
			
			var timer = null;
			
			var resume_polling = function () {
				if (!timer) {
					timer = $.PeriodicalUpdater(info.plays_url, 
						{
						  method: 'get',          // method; get or post
						  data: function () {
								return { after_play: info.move_number, layout: false };
							},
						  minTimeout: 10000,       // starting value for the timeout in milliseconds
						  maxTimeout: 80000,       // maximum length of time between requests
						  type: 'html',           // response type - text, xml, json, etc.  See $.ajax config options
						  maxCalls: 0,            // maximum number of calls. 0 = no limit.
						  autoStop: 0             // automatically stop requests after this many returns of the same data. 0 = disabled.
						}, 
						process_update // Handle the new data (only called when there was a change)
					);
				}
			};
			
			var stop_polling = function () {
				if (timer) {
					clearTimeout(timer);
					timer = null;
				}
			};
			
			var select_current_image_by_position  = function (position) {
				return '.move.active .board #' + position;
			}
			
			var position_of_played_stone = function () {
				var target = $('.move.active .board .empty.' + info.playing);
				if (target.size() == 1) {
					return target.attr('id');
				}
				else return null;
			};
			
			var stone_has_been_legally_placed = function () {
				return info.is_users_turn && ($('.move.active .board .empty.' + info.playing).size() == 1);
			};
			
			var process_update_and_resume_polling = function (html) {
				var k = process_update(html);
				resume_polling;
				return k;
			};
			
			var play_stone = function (position) {
				stop_polling();
			  $.ajax({
			    url: info.create_move_f(position),
			    type: 'POST',
			    dataType: 'html',
			    success: process_update_and_resume_polling,
			    error: function (error_response) {
			      message_dialog('error', 'unable to place a stone at ' + position + ' because: ' + error_response.responseText);
			    },
			  });
			};
			
			var pass = function (callback) {
				// TODO: we know if this will end the game, so branch and show the right thing(tm)???
				stop_polling();
				$.ajax({
			    url: info.create_pass_url,
			    type: 'POST',
			    dataType: 'html',
			    success: function (html) {
						process_update_and_resume_polling();
						if (callback) callback();
					},
			    error: function (error_response) {
			      message_dialog('error', 'unable to pass because: ' + error_response.responseText);
			    },
			  });
			};
			
			var update_active_div = function () {
			  var move_to_unbind_selector = '.move.active';
			  var places_to_unbind_selector = '.move.active .board .valid';
				var lasts_to_reclassify_finder = '.board .last';
				var killed_finder = '.board .atari.empty';
			
			  return function () {
				  var move_to_bind_selector = (info.is_users_turn ? select_move_by_move_number(info.move_number) : NULL_SELECTOR);
			    var places_to_bind_selector = (info.is_users_turn ? move_to_bind_selector + ' .board .empty.valid' : NULL_SELECTOR);
					if ($(places_to_unbind_selector).not(places_to_bind_selector).size() > 0) {
						console.log('unbinding ' + $(places_to_unbind_selector).not(places_to_bind_selector).size() + ' intersections');
					}
					$(places_to_unbind_selector).not(places_to_bind_selector).removeClass('black').removeClass('white');
					if ($(move_to_unbind_selector).not(move_to_bind_selector).size() > 0) {
						console.log('unbinding ' + $(move_to_unbind_selector).not(move_to_bind_selector).size() + ' moves');
					}
					if ($(move_to_unbind_selector).not(move_to_bind_selector).find(killed_finder).size() > 0) {
						console.log('restoring ' + $(move_to_unbind_selector).not(move_to_bind_selector).find(killed_finder).size() + ' stones');
					}
					$(move_to_unbind_selector).not(move_to_bind_selector).find(killed_finder).addClass(info.opponent).removeClass('empty');
					if ($(move_to_unbind_selector).not(move_to_bind_selector).find(lasts_to_reclassify_finder).size() > 0) {
						console.log('re-lasting ' + $(move_to_unbind_selector).not(move_to_bind_selector).find(lasts_to_reclassify_finder).size());
					}
					$('.move').not(move_to_bind_selector).find(lasts_to_reclassify_finder).addClass('latest');
					
					$('.move').not(move_to_bind_selector).removeClass('active');
					$(move_to_bind_selector).addClass('active');
			  };
			}();
			
			var liven_active_positions = function () {
				
				var set_played_stone = function (target, play_p) {
					// restore all other plays
					$('.move.active .board .valid.' + info.playing).not(target).removeClass(info.playing);
					// make the play or remove the play
					if (play_p) {
						target.addClass(info.playing);
						$('.move.active .last').removeClass('latest');
					}
					else {
						target.removeClass(info.playing);
						$('.move.active .last').addClass('latest');
					}
				};
			
				var set_killed_stones = function (target, kill_p) {
					var killed_selector = '.move.active .board .atari.killed_by_' + target.attr('id');
					// restore all atari stones
					$('.move.active .board .atari' ).addClass(info.opponent).removeClass('empty');
					// maybe kill some stones
					if (kill_p) {
						$(killed_selector).removeClass(info.opponent).addClass('empty');
					}
				};
				
				var toggle_placed_stone = function (event_data) {
					var target = $(event_data.currentTarget);
					var playing_stone_p = !target.hasClass(info.playing);
					set_played_stone(target, playing_stone_p);
					set_killed_stones(target, playing_stone_p);
				};
			
				var place_and_play_stone = function (event_data) {
					var target = $(event_data.currentTarget);
					set_played_stone(target, true);
					set_killed_stones(target, true);
					play_stone(target.attr('id'));
				};

				$('.move.active .board .valid').live(SELECTION_EVENT, toggle_placed_stone);
				$('.move.active .board .valid').live('dblclick', place_and_play_stone);
			};
			
			var process_update = function (html) {
				var was_current_move_number = last_displayed_move_number();
	      var update_moves = $(html).filter('.move').filter(function (i) {
					$(this).data('number', was_current_move_number + i + 1); // BOO! updates in a select!!
					return $(this).attr('id') == ('m' + (was_current_move_number + i + 1));
				});
	      if (update_moves.size() > 0) {
					console.log('processing ' + update_moves.size() + ' updated moves');
	        update_moves.insertAfter('.move:last');
					update_elements_with_navigation_handlers(update_moves);
	      }
				$(html).filter('script').each(function (i, el) {
					$.extend(info, jQuery.parseJSON($(el).text()));
				});
				if (update_moves.size() > 0) {
	        update_active_div();
	        update_move_infos();
					update_hey();
	        if ($(select_move_by_move_number(was_current_move_number)).is('.current')) {
						console.log('fading from ' + was_current_move_number + ' to ' + last_displayed_move_number());
	          jQT.goTo($('.move:last'), 'fade');
	        }
				}
	    };
		
			var update_move_infos = function () {
				var selector = select_move_by_move_number(info.move_number);
				console.log('update_move_infos given ' + $(selector).size() + ' move ' + info.move_number);
				if (info.game_state != 'ended') {
					var text;
					if (info.playing && info.playing != '') {
						if (info.is_users_turn) {
							text = "your turn"
						}
						else {
							text = info.opponent + "'s turn"
						}
					}
					else {
						text = "We Go!"
					}
					$(selector).find('.toolbar .playing')
						.addClass('current')
						.text(text);
					var gspan = $(selector).find('.toolbar .gravatar');
					gspan.empty();
					gspan.append(
						$('<img/>').attr('src',
							info.playing == 'black' ? info.black_gravatar_url : info.white_gravatar_url
						)
					);
				}
				else {
					$(selector).find('.toolbar .playing')
						.addClass('current')
						.text('End');
					$(selector).find('.toolbar .gravatar').empty();
				}
				console.log('looking for outdated moves that are not ' + selector);
				$('.move').not(selector).has('.toolbar .playing.current').each(function (index, move_el) {
					console.log('found an outdated move ' + $(move_el).attr('id'));
					$(move_el).find('.toolbar .playing')
						.removeClass('current')
						.text('Move ' + $(move_el).data('number'));
					$(move_el).find('.toolbar .gravatar').empty();
					$(move_el).find('.info .news').text('');
				});
			};

			var get_history_up_to = function (current_move_number) {
				if (current_move_number > 1) {
				  $.ajax({
				    url: info.get_history_f(current_move_number),
				    type: 'GET',
				    dataType: 'html',
				    success: function (html) {
							stop_polling();
			      	update_moves = $(html).filter('.move');
			      	if (update_moves.size() > 0) {
								update_moves.each(function (i, el) {
									$(el).data('number', i + 1);
								});
				      	update_moves.insertAfter('#m0');
								update_elements_with_navigation_handlers(update_moves);
								update_hey();
								resume_polling();
							}
				    },
				    error: function (error_response) {
				      console.error('unable to load the game history before ' + current_move_number + ' because: ' + error_response.responseText);
				    }
				  });
				}
			};

			var update_elements_with_navigation_handlers = function () {
				var MOVE_ANIMATION = 'slide'; // 'slide';
				var goto_move = function (selector, animation, backwards) {
					if ($(selector).size() > 0) {
						if (backwards) {
							jQT.goTo(selector, animation + '.backwards');
						}
						else {
							jQT.goTo(selector, animation);
						}
						return false;
					}
					else return true;
				};
				var swipeBoardLeft = function (target) {
					var this_move = $(target).parents('.move');
					if (this_move.next('.move').size() > 0) {
						var target = this_move.next('.move');
						return goto_move(target, MOVE_ANIMATION, false);
					}
					else {
						position = position_of_played_stone();
						if (position != null) {
							play_stone(position);
						}
						else if (info.is_users_turn) {
							var text;
							if (info.game_state == 'passed') {
								text = 'Since ' + info.opponent + ' just passed, passing will end the game.';
							}
							else {
								text = 'If ' + info.opponent + ' passes, the game will end.';
							}
					    dialog_instance
								.text(text)
								.dialog({
									title: "Really pass?",
									buttons: { 
										"Pass": function() { 
											pass(function () { $(this).dialog("close"); });
										},
										"No":   function() { $(this).dialog("close"); } 
									}
								})
								.dialog('open');
						}
						else {
							message_dialog('Sorry', 'It is not your turn to play or pass');
						}
						return false;
					}
				};
				var swipeBoardRight = function (target) {
					var this_move = $(target).parents('.move');
					var target = this_move.prev('.move')
					return goto_move(target, MOVE_ANIMATION, true);
				};
				return function (selector) {
					elements = $(selector).find('*');
					if (elements.size() == 0) {
						console.warn("unable to update navigation: no elements for " + selector);
					}
					else if ($.support.touch) {
						var swiper = function(event, data) {
				      if (data.direction == 'left') {
				        swipeBoardLeft(event.currentTarget);
				        return false;
				      }
				      else {
				        swipeBoardRight(event.currentTarget);
				        return false;
				      }
				    };
						elements.filter('.board .intersection').bind('swipe.navigation', swiper);
					}
					else {
						elements.filter('.board').gesture(function (gs) {
							if (gs.getName() == 'left') {
								return swipeBoardLeft(this);
							}
							else if (gs.getName() == 'right') {
								return swipeBoardRight(this);
							}
							return true;
						});
					}
				};
			}();
			
			var cache_board_image_paths = function () {
				$.ajax({
				  url: info.board_image_paths_url,
				  success: function (paths) {
						$.each(paths, function (index, path) {
							(new Image(30,30)).src = path;
						});
					},
				  dataType: 'json'
				});
			};
			
			var update_hey = function () {
				$('.hey:not(:empty)').each(function (index, hey_el) {
					var hey = $(hey_el);
					var heyMove = hey.parents('.move');
					heyMove.find('.toolbar #heyButton img').each(function (index, heyButton_el) {
						var heyButton = $(heyButton_el);
						heyButton
							.attr('src', '/images/tools/hey-text-green.png')
							.qtip({
								content:  hey.text(),
								position: {
								   corner: {
								      target: 'bottomMiddle',
								      tooltip: 'topLeft'
								   },
									container: heyMove
								},
								show: {
									when: { event: SELECTION_EVENT, target: heyButton },
									effect: { type: 'fade' }
								},
								hide: { 
									when: { 
										// target: heyMove,
										event: SELECTION_EVENT
									},
									effect: { type: 'fade' }
								},
								style: {
								   border: {
								      width: 5,
								      radius: 5
								   },
								   padding: 10, 
									 tip: { corner: 'topLeft' },
								   textAlign: 'center',
								   name: 'green' 
								}
							});
					});
				});
			};
			
			var document_ready_hook = function () {
		    update_elements_with_navigation_handlers('body');
		    liven_active_positions();
				update_move_infos();
				//cache_board_image_paths();
				resume_polling();
				update_hey();
			};
			
			return {
				  update_move_infos: update_move_infos,
				  update_active_on_current_board: update_active_div,
				  get_history_up_to: get_history_up_to,
					document_ready_hook: document_ready_hook,
					debug: {
						info: function () { return info; },
					}
			};
		}
	};
	return go;
}();