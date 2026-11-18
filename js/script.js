// Assignment 6: shared jQuery interactions and the archive page setup.
function initializeArchiveFeatures($) {
    $(document).ready(function () {
        console.log('jQuery is ready!');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const $toast = $('<div>', {
            class: 'archive-toast', role: 'status', 'aria-live': 'polite'
        }).appendTo('body');
        let toastTimer;

        function showToast(message) {
            clearTimeout(toastTimer);
            const $dialog = $('dialog[open]').first();
            $toast.appendTo($dialog.length ? $dialog : $('body'));
            $toast.stop(true, true).text(message).fadeIn(reducedMotion.matches ? 0 : 160);
            toastTimer = setTimeout(function () {
                $toast.fadeOut(reducedMotion.matches ? 0 : 350);
            }, 2600);
        }
        $(document).on('archive:notify', function (event, message) {
            showToast(message);
        });

        // A valid form can defer its local result while showing a short loading state.
        function restoreSubmitButton(form) {
            const $form = $(form);
            const pending = $form.data('pendingSubmission');
            if (!pending) return null;
            clearTimeout(pending.timer);
            pending.buttons.forEach(function (item) {
                item.element.disabled = item.disabled;
            });
            pending.button.html(pending.originalMarkup);
            $form.removeData('pendingSubmission').removeAttr('aria-busy');
            delete form.dataset.busy;
            const $status = $form.find('[data-form-status]');
            if ($status.attr('data-state') === 'pending') {
                $status.text('').removeAttr('data-state');
            }
            return pending;
        }

        $(document).on('form:validated', 'form[data-validate]', function (event) {
            event.preventDefault();
            const form = this;
            const $form = $(form);
            if ($form.data('pendingSubmission')) return;
            const $button = $form.find('button[type="submit"]');
            const pending = {
                button: $button,
                originalMarkup: $button.html(),
                complete: event.originalEvent.detail.complete,
                buttons: $form.find('button').toArray().map(function (element) {
                    return { element, disabled: element.disabled };
                })
            };
            form.dataset.busy = 'true';
            $form.attr('aria-busy', 'true');
            $form.find('button').prop('disabled', true);
            $button.empty().append(
                $('<span>', { class: 'submit-spinner', 'aria-hidden': 'true' }),
                document.createTextNode(' Подожди…')
            );
            $form.find('[data-form-status]').attr('data-state', 'pending')
                .text('Проверяем форму. Данные не отправляются.');
            pending.timer = setTimeout(function () {
                const finished = restoreSubmitButton(form);
                if (!finished) return;
                finished.complete();
                showToast('Проверка завершена. Это демо: данные не отправлены.');
                if (document.activeElement === document.body && $button.is(':visible')) {
                    $button.trigger('focus');
                }
            }, 1600);
            $form.data('pendingSubmission', pending);
        });

        // Editing or resetting cancels the old check, so it cannot report stale success.
        $(document).on('input change reset', 'form[data-validate]', function () {
            restoreSubmitButton(this);
        });
        $('dialog').on('close', function () {
            $toast.stop(true, true).hide().appendTo('body');
            $(this).find('form[data-validate]').each(function () {
                restoreSubmitButton(this);
            });
        });

        // Clipboard success is shown only after the browser confirms the write.
        $(document).on('click', '[data-copy-text]', async function () {
            const $button = $(this);
            const text = $button.attr('data-copy-text');
            if ($button.prop('disabled')) return;
            $button.prop('disabled', true);
            try {
                if (!navigator.clipboard || !window.isSecureContext) {
                    throw new Error('Clipboard access is unavailable');
                }
                await navigator.clipboard.writeText(text);
                clearTimeout($button.data('copyTimer'));
                $button.find('[data-copy-icon]').text('✓');
                $button.find('.copy-tooltip').remove();
                const tooltipId = 'copyTooltip-' + $('[data-copy-text]').index(this);
                $('<span>', {
                    class: 'copy-tooltip', id: tooltipId, role: 'tooltip',
                    text: 'Скопировано в буфер!'
                }).appendTo($button);
                $button.attr('aria-describedby', tooltipId);
                showToast('Скопировано в буфер обмена.');
                $button.data('copyTimer', setTimeout(function () {
                    $button.find('[data-copy-icon]').text('⧉');
                    $button.find('.copy-tooltip').remove();
                    $button.removeAttr('aria-describedby').removeData('copyTimer');
                }, 2400));
            } catch (error) {
                showToast('Не удалось скопировать. Выдели текст и скопируй его вручную.');
            } finally {
                $button.prop('disabled', false);
            }
        });

        function updateReadingProgress() {
            const $progress = $('#readingProgress');
            if (!$progress.length) return;
            const scrollable = $(document).height() - $(window).height();
            const progress = scrollable > 0
                ? Math.min(100, Math.max(0, $(window).scrollTop() / scrollable * 100))
                : 100;
            $progress.attr('aria-valuenow', Math.round(progress));
            $progress.find('[data-progress-fill]').css('transform', 'scaleX(' + progress / 100 + ')');
            $('[data-progress-label]').text(Math.round(progress) + '%');
        }

        function animateVisibleCounters() {
            $('[data-count-to]').each(function () {
                const $counter = $(this);
                if ($counter.data('counted') || !$counter.is(':visible')) return;
                const top = $counter.offset().top;
                const viewportTop = $(window).scrollTop();
                if (top >= viewportTop + $(window).height() || top + $counter.outerHeight() <= viewportTop) return;
                $counter.data('counted', true);
                const target = Number($counter.attr('data-count-to'));
                if (reducedMotion.matches) {
                    $counter.text(target);
                    return;
                }
                $({ value: 0 }).animate({ value: target }, {
                    duration: 900,
                    step: function (value) { $counter.text(Math.floor(value)); },
                    complete: function () { $counter.text(target); }
                });
            });
        }

        function loadVisibleImages() {
            const viewportTop = $(window).scrollTop();
            const viewportBottom = viewportTop + $(window).height();
            $('img[data-src]').each(function () {
                const $image = $(this);
                if (!$image.is(':visible')) return;
                const top = $image.offset().top;
                if (top >= viewportBottom || top + $image.outerHeight() <= viewportTop) return;
                const source = $image.attr('data-src');
                $image.one('load', function () {
                    $image.addClass('is-loaded');
                }).one('error', function () {
                    $image.addClass('image-unavailable');
                });
                $image.attr('src', source).removeAttr('data-src');
            });
        }

        function updateViewport() {
            updateReadingProgress();
            animateVisibleCounters();
            loadVisibleImages();
        }
        $(window).on('load scroll resize', updateViewport);
        $(document).on('archive:updated', updateViewport);
        if (typeof initializeArchiveSearch === 'function') initializeArchiveSearch($);
        updateViewport();
        document.body.dataset.jqueryReady = 'true';
    });
}

// Keep the required CDN and use the same verified local version if it is unavailable.
if (window.jQuery) {
    initializeArchiveFeatures(window.jQuery);
} else {
    const fallback = document.createElement('script');
    fallback.src = 'assets/vendor/jquery/jquery-4.0.0.min.js';
    fallback.addEventListener('load', function () {
        initializeArchiveFeatures(window.jQuery);
    });
    fallback.addEventListener('error', function () {
        console.error('jQuery could not be loaded from the CDN or the local copy.');
    });
    document.head.append(fallback);
}
