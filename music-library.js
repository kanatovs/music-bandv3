// Release data and collection methods are separate from the page controls.
const musicLibrary = {
    catalogue: Object.freeze([
        { id: 'vsegda-nenavidel-byt-slabym', title: 'всегда ненавидел быть слабым', year: 2024, cover: 'assets/covers/vsegda-nenavidel-byt-slabym.jpg' },
        { id: 'moimi-glazami', title: 'моими глазами', year: 2023, cover: 'assets/covers/moimi-glazami.jpg' },
        { id: 'tebe-zhal-eto-slyshat', title: 'тебе жаль это слышать', year: 2023, cover: 'assets/covers/tebe-zhal-eto-slyshat.jpg' },
        { id: 'tebe-zhal-eto-slyshat-2', title: 'тебе жаль это слышать, Ч. 2', year: 2024, cover: 'assets/covers/tebe-zhal-eto-slyshat-2.jpg' },
        { id: 'skoro', title: 'скоро', year: 2022, cover: 'assets/covers/skoro.jpg' },
        { id: 'ne-hochu', title: 'Не хочу', year: 2022, cover: 'assets/covers/ne-hochu.jpg' },
        { id: 'dom', title: 'дом', year: 2023, cover: 'assets/covers/dom.jpg' },
        { id: 'vryad-li-ty-vyvezesh', title: 'вряд ли ты вывезешь', year: 2023, cover: 'assets/covers/vryad-li-ty-vyvezesh.jpg' },
        { id: 'bolshe-ne-budet-grustno', title: 'больше не будет грустно', year: 2025, cover: 'assets/covers/bolshe-ne-budet-grustno.jpg' }
    ].map((release) => Object.freeze(release))),

    getById(id) {
        return this.catalogue.find((release) => release.id === id);
    },

    filterByYear(year) {
        switch (String(year)) {
            case 'all':
                return this.catalogue.slice();
            case '2022':
            case '2023':
            case '2024':
            case '2025':
                return this.catalogue.filter((release) => release.year === Number(year));
            default:
                return [];
        }
    },

    createCollection() {
        const items = [];
        const ratings = Object.create(null);

        return {
            // Copies let the interface read state without changing it accidentally.
            get items() {
                return items.slice();
            },

            get ratings() {
                return { ...ratings };
            },

            add(id) {
                if (!musicLibrary.getById(id) || items.includes(id)) return false;
                items.push(id);
                return true;
            },

            remove(id) {
                const index = items.indexOf(id);
                if (index === -1) return false;
                items.splice(index, 1);
                return true;
            },

            count() {
                return items.length;
            },

            setRating(id, value) {
                if (!musicLibrary.getById(id) || !Number.isInteger(value) || value < 1 || value > 5) {
                    return false;
                }
                ratings[id] = value;
                return true;
            },

            getRating(id) {
                return ratings[id] || 0;
            }
        };
    }
};
