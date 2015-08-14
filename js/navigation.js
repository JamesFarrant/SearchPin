function open_page(page) {
    $('#'+page).removeClass('hidden');
    $('.main_content').addClass('fading');
    setTimeout(function() {
        $('#'+page).removeClass('fading');
    }, 250);
    setTimeout(function() {
        $('.main_content.fading').addClass('hidden');
    }, 250);
}

$('#intro_button').click(function() {open_page('intro_page')});
$('#help_button').click(function() {open_page('help_page')});
$('#targets_button').click(function() {open_page('search_targets')});
$('#reference_button').click(function() {open_page('reference_page')});
$('#features_button').click(function() {open_page('features_page')});
$('#suffixes_button').click(function() {open_page('suffixes_page')});
$('#donate_button').click(function() {open_page('donate_page')});