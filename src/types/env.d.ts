declare namespace NodeJS {
    interface ProcessEnv {
        /** The version of the project. */
<<<<<<< HEAD
        VERSION: string;
=======
        APP_VERSION: string;
>>>>>>> c16a101 (init)
        /** Sets the enviroment to development mode when running from the 'src' directory and production mode when running from the 'dist' directory. */
        AUTO_DEV_MODE: "true" | "false";
        /** Force the environment to be in development mode. */
        DEV_MODE_OVERRIDE?: "true" | "false";
        /** The token used to authenticate with `Discord`. */
        TOKEN: string;
        /** __(DEV)__ The token used to authenticate with `Discord`. */
        TOKEN_DEV: string;
        /** The URI used for `MongoDB` connections. */
        MONGO_URI: string;
        /** __(DEV)__ The URI used for `MongoDB` connections. */
        MONGO_URI_DEV: string;
    }
}
