import { ChronologyBlock } from "../../watch/mod.chronology.js";

const chronologySet = new Set([
    [65050, 62882, 58034, 59149, 56993, 53074, 57544, 53076, 50934, 51768, 49860, 58033, 55594, 44042, 55593, 38851, 43878], // V-Tuber
    [63778, 61128], // Мастера на все руки выгнали из отряда героев
    [63789, 61211], // Полуночный мотив сердца
    [63382], // Ния Листон
    [60552, 57360], // Компания «Маги-Люмьер»
    [56111], // Хронуар
]);

export default function Rule(id) {
    const blockList = [];

    for (const list of chronologySet) {
        if (!list.includes(id)) {
            blockList.push(...list);
        }
    }

    ChronologyBlock.block(blockList, "system");
}