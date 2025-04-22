import { CreateVerify } from "../../modules/ActionVerify.js";
import { ShowInfo } from "../../modules/Popup.js";
import { TDatabase } from "../../modules/TDatabase.js";

export function OnClearDB(name, description) {
    CreateVerify(description).then((val) => {
        if (val) {
            ClearDB(name);
        }
    })
}

export function ClearDB(name) {
    TDatabase.Delete(name).then((val) => {
        window.location.reload();
    }).catch((msg) => {
        ShowInfo(msg, "db-error");
    })
}