"use client";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DefaultProfile from "@/utilities/DefaultProfile";
import { usePopup } from "@/context/PopupContext";
import Loader from "@/components/Loader";
import { useSession } from "@/context/SessionContext";
import auth from "@/Firebase";

const ProfileEdit = () => {

    const { profile, setProfile } = useSession()
    const router = useRouter()
    const { showPopup } = usePopup()
    const currentUser = auth.currentUser;

    const [profileImage, setProfileImage] = useState(null);
    const [errorMessage, setErrorMessage] = useState("")
    const [fileSizeError, setFileSizeError] = useState("")
    const [isLoading, setLoading] = useState(false)
    const [imagePreview, setImagePreview] = useState(profile?.profileImage?.url || DefaultProfile());

    const fileInputRef = useRef(null);
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

    const onSubmit = async (formData) => {
        setErrorMessage("")
        setLoading(true)

        const updatedData = new FormData();
        updatedData.append("uid", profile?.uid);
        updatedData.append("name", formData.name);
        updatedData.append("username", formData.username);
        updatedData.append("bio", formData.bio);
        if (profileImage) {
            updatedData.append("profileImage", profileImage);
            updatedData.append("previousPublicId", profile.profileImage?.public_id);
        }

        try {
            const token = await currentUser.getIdToken()
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/update-profile`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: updatedData,
            });
            const result = await response.json()
            if (result.success) {
                showPopup("Profile updated successfully !")
                await setProfile(prevData => {
                    return {
                        ...prevData,
                        ...result.updatedData
                    }
                })
                router.push(`/profile/${result.updatedData?.username}`)
            } else {
                setLoading(false)
                setErrorMessage(result.message);
                showPopup("Profile updation failed !", "red")
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        setFileSizeError("")
        if (file && file.size > MAX_FILE_SIZE) {
            setFileSizeError("File size exceeds 5MB. Please select a smaller file.")
            return;
        }
        if (file) {
            setProfileImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center text-white">

            {isLoading ?
                <Loader size={'h-16 w-16'} text={"Please Wait ..."} />
                :
                <div className="max-w-[850px] w-full p-1 md:p-4 rounded-lg shadow-lg">
                    <h1 className="text-3xl md:text-2xl text-center font-semibold my-6">
                        Edit Profile
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="mb-14 max-w-2xl mx-auto rounded-lg p-2 md:p-8 space-y-6">

                        <div className="w-auto flex justify-between items-center bg-accent rounded-3xl md:px-6 px-3">
                            <div className="flex flex-row items-center gap-3 md:gap-5">
                                {imagePreview && (
                                    <div className="my-4 w-14 md:w-[58px] h-14 md:h-[58px] flex justify-center mx-auto">
                                        <Image
                                            src={imagePreview}
                                            width={70}
                                            height={70}
                                            alt="Profile Preview"
                                            className="rounded-full object-cover object-center"
                                        />
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-sm md:text-base font-bold">{profile?.username}</span>
                                    <span className="text-white/60 text-xs md:text-base">{profile?.name}</span>
                                </div>
                            </div>
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        fileInputRef.current.click();
                                    }}
                                    className="px-3 md:px-5 py-2 bg-button-primary hover:bg-button-primary/80 rounded-xl text-sm md:text-sm font-semibold transition duration-300">
                                    Change Photo
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="block font-bold">Name</label>
                            <input
                                placeholder="Name"
                                type="text"
                                {...register("name", { required: "Name is required" })}
                                className="w-full px-4 py-3 text-sm bg-transparent rounded-xl border border-gray-700 focus:outline-none focus:border-sky-500"
                            />
                            {errors.name &&
                                <p className="text-red-500 text-sm md:text-base">{errors.name.message}</p>
                            }
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="block font-bold">Username</label>
                            <input
                                placeholder="Username"
                                type="text"
                                {...register("username", {
                                    required: "Username is required",
                                    minLength: { value: 3, message: "Username must be at least 3 characters long!" },
                                    maxLength: { value: 20, message: "Username cannot exceed 20 characters!" },
                                    pattern: {
                                        value: /^[a-z0-9-]+$/,
                                        message: "Username can only contain lowercase letters, numbers, and dashes (-).",
                                    },
                                })}
                                className="w-full px-4 py-3 text-sm bg-transparent rounded-xl border border-gray-700 focus:outline-none focus:border-sky-500"
                            />
                            {errors.username &&
                                <p className="text-red-500 text-sm md:text-base">{errors.username.message}</p>
                            }
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="block font-bold">Email</label>
                            <div className="w-full relative group">
                                <input
                                    type="email"
                                    disabled
                                    value={profile?.email || ""}
                                    placeholder="Email"
                                    className="w-full px-4 py-3 text-sm bg-transparent disabled:bg-gray-950 disabled:text-gray-400 rounded-xl border border-gray-700 focus:outline-none focus:border-sky-500"
                                />
                                <div
                                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max px-3 md:px-4 py-2 md:py-3 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                    Email cannot be changed.
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="block font-bold">Bio</label>
                            <textarea
                                placeholder="Bio"
                                rows={5}
                                {...register("bio")}
                                className="w-full px-4 py-3 text-sm bg-transparent rounded-xl border border-gray-700 focus:outline-none focus:border-sky-500"
                            />
                        </div>

                        {fileSizeError &&
                            <div className="text-red-500 text-sm md:text-base text-center my-2">
                                {fileSizeError}
                            </div>
                        }

                        {errorMessage &&
                            <div className="text-red-500 text-center mt-2">
                                {errorMessage}
                            </div>
                        }

                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full  bg-button-primary hover:bg-button-primary/80 text-white font-semibold py-3 md:py-2.5 rounded-lg transition duration-300"
                            >
                                Save Changes
                            </button>
                            <Link
                                href={`/profile/${profile?.username}`}
                                className="w-full text-white text-center font-medium bg-button-secondary hover:bg-button-secondary/90 px-3 md:px-4 py-3 md:py-2.5 rounded-lg transition duration-300"
                            >
                                Cancel
                            </Link>
                        </div>

                    </form>

                    <div className="md:hidden w-full text-center mb-20">
                        <p>Looking for something else ?</p>
                        <div className="w-full mx-auto flex flex-row py-2 justify-center gap-5">
                            <Link
                                href={`/profile/${profile?.username}/edit/change-password`}
                                className="text-sky-500"
                            >
                                Change Password
                            </Link>
                            <Link
                                href={`/profile/${profile?.username}/edit/delete-profile`}
                                className="text-sky-500"
                            >
                                Delete Profile
                            </Link>
                        </div>
                    </div>

                </div>
            }
        </div>
    );
};

export default ProfileEdit;
