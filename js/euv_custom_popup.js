/*!
 * euv_custom_popup v1.0.0
 * https://github.com/ulin-evgeny/euv_custom_popup
 * JQuery-плагин для вызова кроссбраузерного, адаптивного, стилизованного попапа, размещенного посередине по горизонтали экрана (с учетом скроллбаров различных браузеров), который можно скроллить.
 */

(function ($) {
    // ===================================
    // Приватные функции
    // ===================================
    // -----------------------
    // Делаем попап посередине
    // -----------------------
    function euv_custom_popup_calc_margins(e) {
        // Этот код нужен, так как в попапе может быть кнопка, которая удаляет попап. Попап удалится, а обработчик висеть будет (закрытия ведь не было). Как результат - ошибка.
        if (!$('.euv-custom-popup.active').length) {
            $(window).off('resize.' + plugin_name, euv_custom_popup_calc_margins);
            return false;
        }

        let $this = e.data.$this;

        // ---------------------------------------
        // По вертикали.
        // Почему нельзя сделать это средствами CSS? Потому что если высота окна маленькая, то лучше бы сделать для попапа вертикальные отступы - минимум 20px - чтобы попап не прижимался к границам экрана. Если высота окна большая, то попап надо разместить посередине - вверху он смотрится некрасиво. В CSS невозможно сделать if'ы.
        // ---------------------------------------
        let mt_percent = $this.data(plugin_name).settings.mt_percent;

        if (mt_percent !== false) {
            let win_h = window.innerHeight;

            let popup_h = $this.outerHeight();

            if (win_h > popup_h + 40) {
                let window_height_without_popup_height = (win_h - popup_h);

                let margin_top = window_height_without_popup_height / 100 * mt_percent;
                let margin_bottom = window_height_without_popup_height - margin_top;

                $this.css('margin-top', margin_top);
                $this.css('margin-bottom', margin_bottom);
            } else {
                $this.css('margin-top', 20);
                $this.css('margin-bottom', 20);
            }
        }

        // ---------------------------------------
        // По горизонтали.
        // Проблема в том, что с помощью box-sizing: content-box и правого padding'а в некоторых браузерах нельзя скрыть скроллбар. Точнее, можно. Но вот место под него все равно останется. Из-за чего попап будет расположен не четко посередине по горизонтали, а левее.
        // ---------------------------------------
        // Получаем размер скроллбара. Это делать надо ПОСТОЯННО, т.к. при изменении размеров экрана размер скроллбара меняется тоже. Для корректного получения размеров нужно, чтобы margin, padding и border у тега html были равны 0.
        let $html = $('html');
        $this.data(plugin_name).html_style = {};
        $this.data(plugin_name).html_style.margin = $html.css('margin');
        $this.data(plugin_name).html_style.padding = $html.css('padding');
        $this.data(plugin_name).html_style.border = $html.css('border');
        $html.css('margin', 0);
        $html.css('padding', 0);
        $html.css('border', 0);
        let scrollbar_size = window.innerWidth - $html.width();
        $html.css('margin', $this.data(plugin_name).html_style.margin);
        $html.css('padding', $this.data(plugin_name).html_style.padding);
        $html.css('border', $this.data(plugin_name).html_style.border);

        // Сбрасываем margin-right до того, как применить новый - чтобы расчеты были правильными
        $this.css('margin-right', 0);

        // Ширина окна без скроллбара
        let window_width = window.innerWidth - scrollbar_size;

        // Расстояние от левого края окна до попапа
        let gap_left = $this.offset().left;

        // Расстояние от правого края окна до попапа
        let gap_right = window_width - gap_left - $this.outerWidth();

        if (gap_left < gap_right) {
            // Число, которое нужно добавить к ширине попапа, чтобы расстояние справа попапа было таким же, как расстояние слева.
            let need_add = gap_right - gap_left;
            $this.css('margin-right', -need_add + 'px');
        } else {
            // Число, которое нужно отнять от ширины попапа, чтобы расстояние справа попапа было таким же, как расстояние слева.
            let need_substract = gap_left - gap_right;
            $this.css('margin-right', need_substract + 'px');
        }
    }

    // -----------------------
    // Закрытие попапа
    // -----------------------
    function close_popup($this) {
        if ($this.closest('.euv-custom-popup.active').length) {
            $('.euv-custom-popup.active').removeClass('active');

            $this.css('display', 'none');

            // Восстанавливаем исходное значение содержимого попапа
            switch ($this.data(plugin_name).settings.reset_on_close) {
                case 'clone':
                    let $inner = $this.data(plugin_name).$inner.clone(true, true);
                    $this.html('');
                    $this.append($inner);
                    $($inner.children()[0]).unwrap();
                    break;
                case 'html':
                    $this.html($this.data(plugin_name).html);
                    break;
            }

            $(window).off('resize.' + plugin_name, euv_custom_popup_calc_margins);

            $this.trigger('after_close');
        }
    }

    // ===================================
    // Публичные функции
    // ===================================
    let methods = {
        // -----------------------
        // Отмена плагина
        // -----------------------
        destroy: function () {
            return this.each(function () {
                let $this = $(this);
                close_popup($this);

                // Удаляем фон, обертки, классы, style
                $this.closest('.euv-custom-popup').find('.euv-custom-popup__bg').remove();
                $this.unwrap().unwrap().unwrap();
                $this.removeClass('euv-custom-popup__content');
                $this.removeAttr('style');

                // Удаляем обработчики
                $(document).off('click.' + plugin_name);

                // Удаляем data-значения
                $this.removeData(plugin_name);
            });
        },

        // -----------------------
        // Вызов
        // -----------------------
        open: function (before_open_function) {
            return this.each(function () {
                let $this = $(this);

                // Это строка нужна, чтобы убрать обработчик - на случай, если попапа не существует (В функции euv_custom_popup_calc_margins, которая вызывается при resize, есть проверка для этого. Также там есть более подробный комментарий.).
                $(window).trigger('resize.' + plugin_name);

                // Сохраняем исходное значение содержимого попапа
                switch ($this.data(plugin_name).settings.reset_on_close) {
                    case 'clone':
                        let $inner = $this.wrapInner('<div class="custom-popup__inner"></div>').children('.custom-popup__inner');
                        $this.data(plugin_name).$inner = $inner.clone(true, true);
                        $($inner.children()[0]).unwrap();
                        break;
                    case 'html':
                        let html = $this.html();
                        $this.data(plugin_name).html = html;
                        break;
                }

                close_popup($this);

                if (typeof before_open_function === 'function') {
                    before_open_function($this);
                } else if (before_open_function !== undefined) {
                    $.error('В вызове jQuery.' + plugin_name + '(\'open\', arg) аргумент arg должен быть функцией.');
                }


                let $euv_custom_popup = $this.closest('.euv-custom-popup');
                $euv_custom_popup.addClass('active');
                $this.css('display', $this.data(plugin_name).display);
                $(window).on('resize.' + plugin_name, {$this: $this}, euv_custom_popup_calc_margins).trigger('resize.' + plugin_name);

                $this.trigger('after_open');
            });
        },

        // -----------------------
        // Закрытие
        // -----------------------
        close: function () {
            return this.each(function () {
                close_popup($(this));
            });
        },

        // -----------------------
        // Инициализация
        // -----------------------
        /**
         * reset_on_close - восстанавливает содержимое попапа после закрытия до того состояния, какое оно было до открытия. Нужно на случай, если пользователь использует один попап для вывода нескольких сообщений и меняет его при открытии.
         * Возможные значения: 'none', 'clone', 'html'. По умолчанию 'none'.
         * Для восстановления содержимого используются соответствующие функции из JQuery (либо вообще не используются - если значение 'none').
         * Важный момент! При использовании 'clone' обработчики, повешенные на какой-либо элемент внутри попапа, могут восстановиться некорректно (Это связано с работой функции clone. Пример такой ситуации есть в examples.). Поэтому, если данная настройка активирована, вешать обработчики рекомендуется через callback функцию - второй параметр функции open (тогда обработчики вешаются прямо перед открытием попапа и убираются после закрытия).
         *
         * mt_percent - margin-top в процентах. 50 - середина экрана. false - отсутствие выравнивания по вертикали через JS (тогда пользователь может сам задать его через css).
         * Возможные значения: число от 0 до 100 или false. По умолчанию 50.
         */
        init: function (settings) {
            return this.each(function () {
                let $this = $(this);

                // -----------------------------------------------
                // Установка переменных и data-значений
                // -----------------------------------------------
                let reset_on_close_values = ['none', 'clone', 'html'];

                settings = $.extend({
                    reset_on_close: reset_on_close_values[0],
                    mt_percent: 50
                }, settings);

                // Валидация settings
                if (reset_on_close_values.indexOf(settings.reset_on_close) === -1) {
                    $.error('jQuery.' + plugin_name + ' - задано некорректное значение для настройки reset_on_close. Данная настройка может принимать следующие значения: ' + reset_on_close_values.join(', ') + '. Вы указали: ' + settings.reset_on_close + '.');
                }

                $this.data(plugin_name, {});
                $this.data(plugin_name).init = true;
                $this.data(plugin_name).settings = settings;
                $this.data(plugin_name).display = $this.css('display');

                $this.css('display', 'none');

                let style = 'max-width: ' + $this.css('max-width');
                let classes_to_close = '.euv-custom-popup__scroll, .euv-custom-popup__bg, .euv-custom-popup__fixed';

                // Обертки и фон для попапа
                let wrapper = '<div class="euv-custom-popup">' +
                    '               <div class="euv-custom-popup__fixed" style="' + style + '">' +
                    '                   <div class="euv-custom-popup__scroll"></div>' +
                    '               </div>' +
                    '           </div>';

                // -----------------------------------------------
                // Добавляем обертки, помещаем в body
                // -----------------------------------------------
                $this.wrap(wrapper);
                $this.addClass('euv-custom-popup__content');
                let $euv_custom_popup = $this.closest('.euv-custom-popup');
                $euv_custom_popup.append('<div class="euv-custom-popup__bg"></div>');

                // -----------------------------------------------
                // Обработчик для закрытия попапа
                // -----------------------------------------------
                let $to_close = $euv_custom_popup.find(classes_to_close);

                $(document).on('click.' + plugin_name, $to_close, function (e) {
                    if (!$(e.target).is($to_close)) {
                        return;
                    }
                    // stopPropagation нужен, чтобы функция вызывалась не много раз, а всего один
                    e.stopPropagation();
                    e.preventDefault();
                    close_popup($this);
                });
            });
        }
    }

    // ===================================
    // Логика вызова функций
    // ===================================
    let plugin_name = 'euv_custom_popup';

    $.fn.euv_custom_popup = function (method) {
        if (methods[method]) {
            // -----------------------------------------------
            // Проверка на вызов функции у неициниализированного элемента
            // -----------------------------------------------
            this.each(function () {
                let $this = $(this);
                if (!$this.data(plugin_name) || $this.data(plugin_name).init !== true) {
                    $.error('Не удалось произвести действие, поскольку для одного из элементов в выборке не инициализирован jQuery.' + plugin_name + '.');
                }
            });

            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            // -----------------------------------------------
            // Проверка на повторную инициализацию
            // -----------------------------------------------
            this.each(function () {
                let $this = $(this);
                if ($this.data(plugin_name) && $this.data(plugin_name).init === true) {
                    $this[plugin_name]('destroy');
                }
            });

            return methods.init.apply(this, arguments);
        } else {
            $.error('Функция с именем ' + method + ' не существует для jQuery.' + plugin_name + '.');
        }
    }

})(jQuery);