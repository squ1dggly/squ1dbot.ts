import { UserModel } from "@utils/mongo/models";
import DocumentUtils from "@utils/mongo/docUtils";

import { userManager_global } from "./_sub/userManager.global";

const docUtils = new DocumentUtils(UserModel);

export const userManager = {
    ...docUtils.__exports,
    global: { ...userManager_global }
};
