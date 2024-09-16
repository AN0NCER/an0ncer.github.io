import { InitMenu } from "../menu.js";
import { Main } from "../modules/ShikiUSR.js";
import { InitCollections } from "./list/mod_collections.js";
import { InitCore } from "./list/mod_core.js"
import { InitSearch } from "./list/mod_search.js";
import { InitUI } from "./list/mod_ui.js";

InitCollections();

Main(async (e) => {
    if (!e)
        return window.location.href = "login.html";

    InitMenu();
    InitCore();
    InitSearch();
    InitUI();
});
