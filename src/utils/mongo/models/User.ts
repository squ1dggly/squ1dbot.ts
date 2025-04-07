import { Schema, model as Model } from "mongoose";

export interface IUser {
    _id: string;
};

export const UserSchema = new Schema<IUser>(
    {
        _id: { type: String, required: true }
    },
    { collection: "Users" }
);

export const UserModel = Model<IUser>("Users", UserSchema);
