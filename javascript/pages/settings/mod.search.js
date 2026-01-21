export function Search() {
    let previousSearchValue = null;
    let currentMatchIndex = 0;

    const onIput = (value) => {
        value = value.trim().toLowerCase();


        if (previousSearchValue === value) return;
        previousSearchValue = value;
        currentMatchIndex = 0;

        perfomSerach(value);
    }

    return {
        oninput: onIput,
        onsearch: (value) => { navigateToNextMatch() }
    }

    function perfomSerach(searchValue) {
        const searchableItems = $('[param]');

        if (searchValue.length === 0) {
            searchableItems.removeClass('-search');
            return;
        }

        searchableItems.each(function () {
            const $item = $(this);
            const title = $item.find('[tit]').text().toLocaleLowerCase();

            if (title.startsWith(searchValue)) {
                $item.addClass('-search');
            } else {
                $item.removeClass('-search');
            }
        });

        highlightCurrentMatch();
    }

    function highlightCurrentMatch() {
        const matches = $('.-search');

        if (matches.length === 0) return;

        // Ensure index is within bounds
        if (currentMatchIndex >= matches.length) {
            currentMatchIndex = 0;
        }

        // Remove all current highlights
        matches.removeClass('-current');

        // Add highlight to current match
        const currentMatch = matches.eq(currentMatchIndex);
        currentMatch.addClass('-current');

        // Scroll to current match
        currentMatch[0]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
        });
    }

    function navigateToNextMatch() {
        const matches = $('.-search');

        if (matches.length === 0) return;

        // Remove current highlight
        matches.removeClass('-current');

        // Move to next match (cycle back to 0 if at end)
        currentMatchIndex = (currentMatchIndex + 1) % matches.length;

        // Highlight and scroll to current match
        highlightCurrentMatch();
    }
}