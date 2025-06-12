import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary';
import { promises as fs } from "fs";
import cors from 'cors'
import dotenv from "dotenv";

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())


// multer config 

const storage = multer.memoryStorage();

const upload = multer({
    limits: {
        fileSize: 3 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true)
        }
        else {
            cb(new Error("Only Image is Required"), false);
        }
    }
})


// cloudinary config 

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImageInClodinary = (buffer, fileName) => {
    return new Promise((res, rej) => {
        cloudinary.uploader.upload_stream({
            resource_type: 'image',
            public_id: `${Date.now()}_${fileName}`,
            folder: 'user_upload'
        },
            (error, result) => {
                if (error) {
                    rej(error)
                }
                else {
                    res(result)
                }
            }
        ).end(buffer)
    })
}

const ReadDataFile = async () => {
    try {
        const data = await fs.readFile('data.json', 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        console.log(error);
        return []

    }
}

const writeDataToFile = async (data) => {
    try {
        await fs.writeFile("data.json", JSON.stringify(data, null, 2));
        console.log("Data insert into the file");
    } catch (error) {
        console.log("Something went wrong while writing Data");
        console.log(error);
    }
};

app.post("/api/user/create", upload.single('image'), async (req, res) => {
    try {
        const { name, email } = req.body
        if (!name || !email) {
            return res.send({
                message: "Name and Email is Required",
                success: false,
            });
        }

        if (!req.file) {
            return res.send({ success: false, message: "Image is required" });
        }
        const uploadImage = await uploadImageInClodinary(req.file.buffer, req.file.originalname)

        const newUser = {
            name: name,
            email: email,
            image: uploadImage.secure_url,
            id: uploadImage.public_id
        }

        const existingData = await ReadDataFile();
        console.log(existingData)
        existingData.push(newUser);
        await writeDataToFile(existingData);
        return res.send({ message: "User Created Succesfully", success: true, user: newUser });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });

    }
})



app.get('/all-users', async (req, res) => {

    const allUsers = await ReadDataFile()
    res.send({
        users: allUsers
    })
})



app.listen(3000, () => {
    console.log(`Server is Running on Port 3000`);
});
