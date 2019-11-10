$(function () {
    // ----------------------------------
    // Вспомогательные функции
    // ----------------------------------
    function get_random_color() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    // ----------------------------------
    // Обычный попап
    // ----------------------------------
    let $simple_popup = $('.simple-popup');
    $simple_popup.euv_custom_popup();

    $('.open-simple-popup').on('click', function () {
        $simple_popup.euv_custom_popup('open');
    });

    $('.simple-popup__close-btn').on('click', function () {
        $simple_popup.euv_custom_popup('close');
    });

    $('.simple-popup__action-btn').on('click', function () {
        $simple_popup.find('.simple-popup__text').css('color', get_random_color());
    });

    // ----------------------------------
    // Попап c reset_on_close: 'clone'
    // ----------------------------------
    let $clone_popup = $('.clone-popup');
    $clone_popup.euv_custom_popup({reset_on_close: 'clone'});

    $('.open-clone-popup').on('click', function () {
        $clone_popup.euv_custom_popup('open');
    });

    $('.clone-popup__close-btn').on('click', function () {
        $clone_popup.euv_custom_popup('close');
    });

    let $clone_popup_action_btn = $('.clone-popup__action-btn');
    let $clone_popup_text = $clone_popup.find('.clone-popup__text');
    $clone_popup_action_btn.on('click', function () {
        // Этот код будет работать только при первом показе попапа, т.к. здесь используется переменная $clone_popup_text, которая ссылается на несуществующий (после первого закрытия попапа) объект.
        $clone_popup_text.css('color', get_random_color());
    });

    // ----------------------------------
    // Попап c reset_on_close: 'html'
    // ----------------------------------
    let $html_popup = $('.html-popup');
    $html_popup.euv_custom_popup({reset_on_close: 'html'});

    $('.open-html-popup').on('click', function () {
        $html_popup.euv_custom_popup('open', function ($popup) {
            $popup.find('.html-popup__close-btn').on('click', function () {
                $popup.euv_custom_popup('close');
            });

            $popup.find('.html-popup__action-btn').on('click', function () {
                $popup.find('.html-popup__text').css('color', get_random_color());
            });
        });
    });

});