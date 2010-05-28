// (c) 2010 Reg Braithwaite. All rights to the entirety of the program and its parts are reserved with 
// the exception of specific files otherwise licensed. Other licenses apply only to the files where
// they appear.

;(function ($, undefined) {
	
	var assign_gravatar = function (event) {
	    $(this)
			.closest('.email')
				.find('img')
					.replaceWith($.gravatar($(this).val(), {
				        // integer size: between 1 and 512, default 80 (in pixels)
				        size: 40,
				        // maximum rating (in order of raunchiness, least to most): g (default), pg, r, x
				        rating: 'pg',
				        // url to define a default image (can also be one of: identicon, monsterid, wavatar)
				        image: 'monsterid'
				    }));
	};
	
	var game_specific_options = function	(event) {
		var game_setup = $.parseJSON($('form.new_game #rules').val());
		var setup_text = $('form.new_game #setup').val();
		$('form.new_game #setup')
			.empty();
		$.each(go.referee.rules.setups[game_setup.setups], function (index, setup) {
			$('<option></option>')
				.text(setup.text)
				.attr('value', setup.text)
				.appendTo($('form.new_game #setup'));
			}
		);
		if ($('form.new_game #setup').has('option:text('+setup_text+')').size() > 0)
			$('form.new_game #setup')
				.val(setup_text);
		else if (setup_text)
			$('form.new_game #setup')
				.val($('form.new_game #setup option:first').text());
		$('form.new_game #dimension')
			.empty();
		$.each(game_setup.sizes, function (index, size) {
			$('<option></option>')
				.text('' + size + 'x' + size)
				.attr('value', size)
				.appendTo($('form.new_game #dimension'));
			}
		);
	};
	
	var setup_new_game = function () {
		$('form.new_game .email input')
			.each(assign_gravatar)
			.blur(assign_gravatar);
		$('form.new_game .rules select')
			.each(game_specific_options)
			.blur(game_specific_options)
			.change(game_specific_options);
    	$('form.new_game').submit(function (e) {
			go.sgf.game_info = {
				FF: 4,
				SZ: $('form.new_game #dimension').val(),
				AP: "World of Go",
				PB: $('form.new_game #black').val() || 'Black' ,
				PW: $('form.new_game #white').val() || 'White',
				GR: $('form.new_game #rules option:selected').text(),
				GS: $('form.new_game #setup option:selected').text()
			};
			go.sgf.root = [go.sgf.game_info];
			go.sgf.current = go.sgf.root;
			go.letters = go.letters.slice(0, go.sgf.game_info.SZ);
			$('.move')
				.removeClass('black white')
				.find('.board')
					.removeClass('size9 size11 size13 size15 size17 size19')
					.addClass('size' + go.sgf.game_info.SZ)
					.find('.dragger')
						.empty();
			$.each(go.letters, function (down_index, down_letter) {
				$('<div></div>')
					.addClass('row')
					.into(function (row) {
						$.each(go.letters, function (across_index, across_letter) {
							$('<img/>')
								.addClass('intersection')
								.attr('id', across_letter + down_letter)
								.attr('src', 'i/dot_clear.gif')
								.appendTo(row);
						});
					})
					.appendTo($('.move .board .dragger'));
			});
			var game_setup = $.parseJSON($('form.new_game #rules').val());
			go.sgf.game_info.GM = game_setup.GM;
			go.referee.set_rules(game_setup);
			var setup_text = $('form.new_game #setup').val();
			var setup;
			$.each(go.referee.rules.setups[game_setup.setups], function (i, each_setup) {
				if (each_setup.text == setup_text)
					setup = each_setup;
			});
			$.extend(go.sgf.game_info, setup.sgf);
			setup.setup();
			go.sgf.doit($('.move.play .board'), go.sgf.game_info);
			$('#info')
				.find('.players .black')
					.text(go.sgf.game_info.PB)
					.end()
				.find('.players .white')
					.text(go.sgf.game_info.PW)
					.end()
				.find('h1')
					.text(go.sgf.game_info.GR)
					.end()
				.find('.game .setup')
					.text(go.sgf.game_info.GS)
					.end();
			go.set_titles();
			jQT.swapPages($('#new'), $('.move.play'));
      		return false;
    	});
	};
	
	go.on_document_ready(setup_new_game);
	
})(jQuery);