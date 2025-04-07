import { Schema, model as Model } from "mongoose";

export interface IGlobalUser {
    _id: string;

    customReplyIdsFound: number[];
}

export const GlobalUserSchema = new Schema<IGlobalUser>(
    {
        _id: { type: String, required: true },

        customReplyIdsFound: { type: [Number], default: [] }
    },
    { collection: "GlobalUsers" }
);

export const GlobalUserModel = Model<IGlobalUser>("GlobalUsers", GlobalUserSchema);
