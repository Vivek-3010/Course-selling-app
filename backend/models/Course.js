import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    image: {
        type: Object,  // Explicitly define image as an object
        required: true,
    },
    creatorId:{
        type: mongoose.Types.ObjectId,
        ref: "Admin"
    }
});

export const Course = mongoose.model("Course", courseSchema);
