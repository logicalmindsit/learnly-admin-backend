
import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: {
            values: ['Male', 'Female', 'Other'],
            message: 'Gender must be Male, Female, or Other'
        }
    },
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [18, 'Staff must be at least 18 years old'],
        max: [100, 'Age cannot exceed 100 years']
    },
    address: {
        street: { type: String, required: [true, 'Street address is required'], trim: true },
        city: { type: String, required: [true, 'City is required'], trim: true },
        state: { type: String, required: [true, 'State is required'], trim: true },
        postalCode: { type: String, required: [true, 'Postal code is required'], trim: true },
        country: { type: String, required: [true, 'Country is required'], trim: true }
    },
    aadharNumber: {
        type: String,
        required: [true, 'Aadhar number is required'],
        unique: true,
        validate: {
            validator: function(v) {
                return /^\d{12}$/.test(v);
            },
            message: props => `${props.value} is not a valid Aadhar number! Must be 12 digits.`
        }
    },
    designation: {
        type: String,
        required: [true, 'Designation is required'],
        trim: true,
        maxlength: [100, 'Designation cannot exceed 100 characters']
    },
    profilePicture: {
        public_id: {
            type: String,
            default: null,
        },
        url: {
            type: String,
            default: null,
        }
    },
    date: {
        type: Date,
        default: Date.now
    }
},{timestamps:true});

const StaffDetails = mongoose.model('StaffDetails', staffSchema);
export default StaffDetails;