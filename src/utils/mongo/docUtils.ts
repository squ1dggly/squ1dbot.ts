import { Model, QueryOptions, RootFilterQuery, UpdateQuery } from "mongoose";

export type ProjectionTemplate<T> = {
    [P in keyof T]: number;
};

export interface DocumentQueryOptions<T> extends QueryOptions {
    /** ___CAUTION: Upserting a document this way will only save the `_id` property.___
     *
     * ___If you have other required properties, they will be ignored and might throw an error upon saving.___
     *
     * ___Use {@link DocumentUtils.insertOrUpdate insertOrUpdate} instead for the above case.___*/
    upsert?: boolean;
    /** The template used to filter the returned document.
     *
     * If there's at least one `1` in the query, the document will by default only return the specified props.
     *
     * ___NOTE:___ `_id` and `__v` is always included unless specified otherwise.
     *
     * - Include prop: `1`
     *
     * - Exclude prop: `0` */
    projection?: Partial<ProjectionTemplate<T>>;
}

export interface DocumentUpsertOptions<T> extends DocumentQueryOptions<T> {
    /** If `true`, the document will be checked if it already exists before continuing the operation. Defaults to `true`.
     *
     * Setting to `false` saves a call to the database if you're already checking existance beforehand. */
    checkExists?: boolean;
}

export default class DocumentUtils<T> {
    constructor(public model: Model<T>) {}

    get __exports() {
        return {
            /** Count the number of documents in the collection.
             * @param filter An optional filter to count only the documents that match it. */
            __count: this.count,

            /** Check if a document exists in the collection based on the provided filter.
             * @param filter The filter used to find the document. It can be a string representing the document's `_id` or an object representing the document's properties. */
            __exists: this.exists,

            /** Insert a document into the collection if it doesn't already exist, or updates it if it does.
             * @param _id The unique identifier for the document.
             * @param upsertQuery The query to use for the upsert operation.
             * @param upsertOptions Optional parameters for the upsert operation. `lean` is `true` by default. */
            __insertOrUpdate: this.insertOrUpdate,

            /** Delete a document from the collection based on the provided `_id` or filter.
             * @param filter The filter used to find the document. It can be a string representing the document's `_id` or an object representing the document's properties. */
            __delete: this.delete,

            /** Delete all documents from the collection that match the provided filter.
             * @param filter The filter used to find the documents to delete. */
            __deleteAll: this.deleteAll,

            /** Fetch a document from the collection based on the provided `_id` or filter.
             * @param filter The filter used to find the document. It can be a string representing the document's `_id` or an object representing the document's properties.
             * @param options Optional parameters for filtering and querying the document. `lean` is `true` by default. */
            __fetch: this.fetch,

            /** Fetch all documents from the collection that match the provided filter.
             * @param filter The filter used to find the documents.
             * @param options Optional parameters for filtering and querying the document. `lean` is `true` by default. */
            __fetchAll: this.fetchAll,

            /** Update a document in the collection based on the provided filter.
             * @param filter The filter used to find the document. It can be a string representing the document's `_id` or an object representing the document's properties.
             * @param query The update operations to be applied to the document.
             * @param options Optional parameters for the update operation. `lean` is `true` by default. */
            __update: this.update,

            /** Update a document in the collection based on the provided filter.
             * @param filter The filter used to find the document. It can be a string representing the document's `_id` or an object representing the document's properties.
             * @param updateQuery The update operations to be applied to the document. */
            __updateAll: this.updateAll
        };
    }

    /** Count the number of documents in the collection.
     * @param filter An optional filter to count only the documents that match it. */
    count = async (filter?: RootFilterQuery<T>): Promise<number> => {
        return await this.model.countDocuments(filter);
    };

    /** Check if a document exists in the collection based on the provided filter.
     * @param filter The filter used to find the document. It can be a string representing the document's `_id` or an object representing the document's properties. */
    exists = async (filter: string | RootFilterQuery<T>): Promise<boolean> => {
        switch (typeof filter) {
            case "string":
                return (await this.model.exists({ _id: filter })) ? true : false;
            case "object":
                return (await this.model.exists(filter)) ? true : false;
            default:
                return false;
        }
    };

    /** Insert a document into the collection if it doesn't already exist, or updates it if it does.
     * @param _id The unique identifier for the document.
     * @param upsertQuery The query to use for the upsert operation.
     * @param upsertOptions Optional parameters for the upsert operation. `lean` is `true` by default. */
    insertOrUpdate = async (_id: string, upsertQuery: Partial<T> = {}, upsertOptions: DocumentUpsertOptions<T> = {}) => {
        const _upsertOptions = { ...upsertOptions, lean: upsertOptions?.lean ?? true };
        if ((upsertOptions.checkExists ?? true) && (await this.exists(_id)))
            return await this.update(_id, upsertQuery, _upsertOptions);
        return await new this.model({ _id, ...upsertQuery }).save();
    };

    /** Delete a document from the collection based on the provided `_id` or filter.
     * @param filter The filter used to find the document. It can be a string representing the document's `_id` or an object representing the document's properties. */
    delete = async (filter: string | RootFilterQuery<T>) => {
        if (typeof filter === "string") {
            return await this.model.findByIdAndDelete(filter);
        } else {
            return await this.model.deleteOne(filter);
        }
    };

    /** Delete all documents from the collection that match the provided filter.
     * @param filter The filter used to find the documents to delete. */
    deleteAll = async (filter: RootFilterQuery<T>) => {
        return await this.model.deleteMany(filter);
    };

    /** Fetch a document from the collection based on the provided `_id` or filter.
     * @param filter The filter used to find the document. It can be a string representing the document's `_id` or an object representing the document's properties.
     * @param options Optional parameters for filtering and querying the document. `lean` is `true` by default. */
    fetch = async (filter: string | RootFilterQuery<T>, options: DocumentQueryOptions<T> = {}) => {
        const _options = { ...options, projection: undefined, lean: options?.lean ?? true };
        if (typeof filter === "string") {
            return await this.model.findById(filter, options?.projection, _options);
        } else {
            return await this.model?.findOne(filter, options?.projection, _options);
        }
    };

    /** Fetch all documents from the collection that match the provided filter.
     * @param filter The filter used to find the documents to fetch.
     * @param options Optional parameters for filtering and querying the document. `lean` is `true` by default. */
    fetchAll = async (filter: RootFilterQuery<T>, options: DocumentQueryOptions<T> = {}) => {
        const _options = { ...options, projection: undefined, lean: options?.lean ?? true };
        return await this.model.find(filter, options?.projection, _options);
    };

    /** Update a document in the collection based on the provided filter.
     * @param filter The filter used to find the document. It can be a string representing the document's `_id` or an object representing the document's properties.
     * @param updateQuery The update operations to be applied to the document.
     * @param options Optional parameters for the update operation. `lean` is `true` by default. */
    update = async (
        filter: string | RootFilterQuery<T>,
        updateQuery: UpdateQuery<T>,
        options: DocumentQueryOptions<T> = {}
    ) => {
        const _options = { ...options, lean: options?.lean ?? true };
        if (typeof filter === "string") {
            return await this.model.findByIdAndUpdate(filter, updateQuery, _options);
        } else {
            return await this.model.findOneAndUpdate(filter, updateQuery, _options);
        }
    };

    /** Update a document in the collection based on the provided filter.
     * @param filter The filter used to find the documents to update.
     * @param updateQuery The update operations to be applied to the document. */
    updateAll = async (filter: RootFilterQuery<T>, updateQuery: UpdateQuery<T>) => {
        return await this.model.updateMany(filter, updateQuery);
    };
}