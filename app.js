import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'
import cors from 'cors'
import dotenv from "dotenv";

dotenv.config()

const app = express()

