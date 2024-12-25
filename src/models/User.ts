import { Schema, model as Model } from "mongoose";

export interface IUser {
    _id: string;
};

export const schema = new Schema<IUser>(
    {
        _id: { type: String, required: true }
    },
    { collection: "Users" }
);

export const model = Model<IUser>("Users", schema);
