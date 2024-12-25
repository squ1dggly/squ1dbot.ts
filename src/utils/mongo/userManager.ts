import { userModel } from "@models";
import DocumentUtils from "./docUtils";

const docUtils = new DocumentUtils(userModel);

export default {
    ...docUtils.__exports
};
