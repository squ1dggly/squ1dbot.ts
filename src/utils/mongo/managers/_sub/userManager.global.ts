import { GlobalUserModel } from "@utils/mongo/models";
import DocumentUtils from "@utils/mongo/docUtils";

const docUtils = new DocumentUtils(GlobalUserModel);

export const userManager_global = {
    ...docUtils.__exports,
};
