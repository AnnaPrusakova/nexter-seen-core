import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI as string;

exports.connect = () => {
    mongoose
        .connect(MONGO_URI)
        .then(() => {
            console.log("connected to database successfully...");
        })
        .catch((error: Error) => {
            console.log(
                "failed to connect to the database. terminating the application..."
            );
            console.error(error);
            process.exit(1);
        });
};
