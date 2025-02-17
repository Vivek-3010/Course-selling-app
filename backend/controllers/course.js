import mongoose from "mongoose";
import { Course } from "../models/course.js";
import { v2 as cloudinary } from 'cloudinary';
import { Purchase } from "../models/Purchase.js";

// Create Course
export const createCourse = async (req, res) => {
    const adminId = req.adminId;
    const { title, description, price } = req.body;

    try {
        if (!title || !description || !price) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const { image } = req.files;
        const allowedFormat = ["image/png", "image/jpeg"];

        if (!allowedFormat.includes(image.mimetype)) {
            return res.status(400).json({ error: "Invalid file format. Only PNG and JPEG files are allowed" });
        }

        const uploadResult = await cloudinary.uploader.upload(image.tempFilePath);

        if (!uploadResult || !uploadResult.public_id || !uploadResult.url) {
            return res.status(500).json({ error: "Image upload failed" });
        }

        const courseData = {
            title,
            description,
            price,
            image: { 
                public_id: uploadResult.public_id,
                url: uploadResult.secure_url,  
            },
            creatorId: adminId,
        };

        const course = await Course.create(courseData);
        return res.status(201).json({ message: "Course created successfully", course });

    } catch (error) {
        console.error("Error creating course:", error);
        return res.status(500).json({ error: error.message || "Error creating course" });
    }
};

// Update Course
export const updateCourse = async (req, res) => {
  const adminId = req.adminId;
  const { courseId } = req.params;
  const { title, description, price } = req.body;

  try {
      // Find the course
      const course = await Course.findOne({ _id: courseId, creatorId: adminId });
      if (!course) {
          return res.status(404).json({ error: "Course not found or created by another admin" });
      }

      let imageData = course.image; // Keep existing image by default

      // Check if a new image file is uploaded
      if (req.files && req.files.image) {
          const image = req.files.image;
          const allowedFormats = ["image/png", "image/jpeg"];

          if (!allowedFormats.includes(image.mimetype)) {
              return res.status(400).json({ error: "Invalid file format. Only PNG and JPEG files are allowed" });
          }

          // Delete the old image from Cloudinary (optional)
          if (course.image && course.image.public_id) {
              await cloudinary.uploader.destroy(course.image.public_id);
          }

          // Upload the new image
          const uploadResult = await cloudinary.uploader.upload(image.tempFilePath);
          imageData = {
              public_id: uploadResult.public_id,
              url: uploadResult.secure_url
          };
      }

      // Update course
      const updatedCourse = await Course.findByIdAndUpdate(
          courseId,
          {
              title,
              description,
              price,
              image: imageData
          },
          { new: true }
      );

      res.status(200).json({ message: "Course updated successfully", course: updatedCourse });

  } catch (error) {
      console.error("Error in course updating:", error);
      res.status(500).json({ error: "Error in course updating" });
  }
};

// Delete Course
export const deleteCourse = async (req, res) => {
    const adminId = req.adminId;
    const { courseId } = req.params;

    try {
      const course = await Course.findOneAndDelete({
        _id: courseId,
        creatorId: adminId,
      });

      if (!course) {
        return res.status(404).json({ error: "Can't delete, created by other admin" });
      }

      res.status(200).json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error("Error in course deleting:", error);
      res.status(500).json({ error: "Error in course deleting" });
    }
};

// Get all courses
export const getCourses = async (req, res) => {
    try {
        const courses = await Course.find({});
        res.status(200).json({ courses });
    } catch (error) {
        console.error("Error in getting courses:", error);
        res.status(500).json({ error: "Error in getting courses" });
    }
}

// Get course details
export const courseDetails = async (req, res) => {
    const { courseId } = req.params;
    try {
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }
        res.status(200).json({ course });
    } catch (error) {
        console.error("Error in getting course details:", error);
        res.status(500).json({ error: "Error in getting course details" });
    }
}

// Buy Course
export const buyCourse = async (req, res) => {
    const { userId } = req;
    const { courseId } = req.params;

    try {
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        const existingPurchase = await Purchase.findOne({ userId, courseId });
        if (existingPurchase) {
            return res.status(400).json({ error: "User has already purchased this course" });
        }

        const newPurchase = new Purchase({ userId, courseId });
        await newPurchase.save();
        res.status(201).json({ message: "Course purchased successfully", newPurchase });
    } catch (error) {
        console.error("Error in buying course:", error);
        res.status(500).json({ error: "Error in buying course" });
    }
}
