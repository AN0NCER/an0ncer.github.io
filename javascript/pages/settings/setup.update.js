import { $PWA } from "../../core/pwa.core.js";
import { WindowSelector } from "./mod.selector.js";

let INDEX = -1;

const VARIATION = [
    { key: '1', val: '1 Файл' },
    { key: '2', val: '2 Файла' },
    { key: '3', val: '3 Файла' },
    { key: '4', val: '4 Файла' },
    { key: '5', val: '5 Файлов' },
];

const setup = [
    {
        param: 'updateshow',
        type: 'checkbox.tip',
        title: 'Оповещение',
        description: `Показывает окно с информацией о загружаемой версии и прогрессе обновления при старте приложения.`
    },
    {
        type: 'checkbox.tip',
        param: 'u_p_d_1',
        title: 'Авто-Обновление',
        description: 'Автоматически устанавливает обновления без запроса на подтверждение. Работает только если включены уведомления об обновлениях.',
        dependsOn: { param: 'updateshow', value: true },
        enable: () => {
            return $PWA.enabled;
        },
        get: () => {
            return new Promise((resolve) => {
                $PWA.message.GET_SETUP({ key: 'install' }).then((val) => {
                    resolve(val.install);
                });
            });
        },
        set: (value) => {
            $PWA.message.SETUP({ 'install': { install: value } });
        }
    },
    {
        enable: (id) => {
            $PWA.events.on('load', (e) => {
                $(`[data-id="${id}"]`).removeClass('-disable');
            }, { replay: true });
            return false;
        },

        click: WindowSelector,
        type: 'sel.one',
        icon: 'boxes-stacked',
        title: 'Параллельная загрузка',
        description: `Устанавливает количество файлов, загружаемых одновременно во время обновления. Увеличение значения может ускорить установку, но потребует больше ресурсов.`,
        variation: VARIATION,

        getValue: () => {
            if (INDEX !== -1) {
                return VARIATION[INDEX].val;
            }
            return new Promise((resolve) => {
                $PWA.message.GET_SETUP({ key: 'install' }).then((val) => {
                    if (val.batchSize) {
                        INDEX = VARIATION.findIndex(x => x.key === `${val.batchSize}`);
                        resolve(VARIATION[INDEX].val);
                    }
                })
            });
        },

        setValue: (index) => {
            INDEX = index;
            $PWA.message.SETUP({ 'install': { batchSize: parseInt(VARIATION[index].key) } });
        },

        getIndex: () => {
            return INDEX;
        }
    }
]

export default setup;