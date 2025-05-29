import { debounce } from "./mod.func.js";

export function Search() {
    let previousSearchValue = null;
    let currentMatchIndex = 0;
    const searchInput = $('.search-input > input');
    const clearButton = $('.search-input > .btn-empty');

    if (!searchInput.length) return;

    searchInput.on('input', debounce(function () {
        const currentValue = this.value.trim().toLowerCase();

        if (previousSearchValue === currentValue) return;
        previousSearchValue = currentValue;
        currentMatchIndex = 0; // Reset index when search changes

        perfomSerach(currentValue);
    }, 300));

    searchInput.on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            navigateToNextMatch();
        }
    });

    clearButton.on('click', function () {
        clearSearch();
    });

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

    function clearSearch() {
        // Clear input value
        searchInput.val('');

        // Reset variables
        previousSearchValue = null;
        currentMatchIndex = 0;

        // Remove all search classes
        const searchableItems = $('[param]');
        searchableItems.removeClass('-search -current');

        // Focus back to input
        searchInput.focus();
    }
}