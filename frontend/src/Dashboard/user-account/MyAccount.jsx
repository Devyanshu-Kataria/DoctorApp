import { useContext, useState } from "react";

import { authContext } from "./../../context/AuthContext";

import MyBookings from "./MyBookings";
import Profile from "./Profile";

import useGetProfile from "../../hooks/useFetchData";
import { BASE_URL, token } from "../../config";

import Loading from "../../components/Loader/Loading";
import Error from "../../components/Error/Error";
import userImage from "../../assets/images/avatar-icon.png";
import uploadImageToCloudinary from "../../utils/uploadCloudinary";
import { toast } from 'react-toastify';



const MyAccount = () => {
    const { dispatch } = useContext(authContext);
    const [tab, setTab] = useState('bookings');
    const [loading, setLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);

    const {
        data: userData,
        loading: fetchLoading,
        error,
    } = useGetProfile(`${BASE_URL}/users/profile/me`);

    console.log(userData, "userdata");

    const handleLogout = () => {
        dispatch({ type: "LOGOUT" });
    };

    const handleFileInputChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type and size
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG or PNG)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast.error('Image size should be less than 5MB');
            return;
        }

        // Show preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePhoto(reader.result);
        };
        reader.readAsDataURL(file);

        try {
            setLoading(true);
            console.log('Uploading file:', file.name, file.type, file.size);
            
            const uploadResult = await uploadImageToCloudinary(file);
            console.log('Upload result:', uploadResult);
            
            if (uploadResult?.url) {
                // Update user photo in the backend
                const res = await fetch(`${BASE_URL}/users/${userData._id}`, {
                    method: "put",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ...userData,
                        photo: uploadResult.url
                    }),
                });

                const result = await res.json();
                console.log('Backend update result:', result);
                
                if (!res.ok) {
                    throw new Error(result.message || 'Failed to update profile');
                }

                // Update context
                dispatch({
                    type: "UPDATE_USER",
                    payload: {
                        ...userData,
                        photo: uploadResult.url
                    }
                });

                toast.success("Profile photo updated successfully!");
                
                // Reload after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } catch (error) {
            console.error('Error updating profile photo:', error);
            toast.error(error.message || "Failed to update profile photo");
            setProfilePhoto(null);
        } finally {
            setLoading(false);
        }
    };

    // Default avatar as SVG
    const defaultAvatar = `data:image/svg+xml,${encodeURIComponent('<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#0067FF"/><path d="M50 25C56.4107 25 61.6071 30.1964 61.6071 36.6071C61.6071 43.0179 56.4107 48.2143 50 48.2143C43.5893 48.2143 38.3929 43.0179 38.3929 36.6071C38.3929 30.1964 43.5893 25 50 25ZM50 62.5C66.5179 62.5 75 68.75 75 72.3214V75H25V72.3214C25 68.75 33.4821 62.5 50 62.5Z" fill="white"/></svg>')}`;

    return (
        <section>
          <div className="max-w-[1170px] px-5 mx-auto">
            {fetchLoading && !error && <Loading />}
            {error && !fetchLoading && <Error errMessage={error} />}
            {!fetchLoading && !error && userData && (
              <div className="grid md:grid-cols-3 gap-10">
                {/* Left column */}
                <div className="pb-[50px] px-[30px] rounded-md">
                  {/* Profile details */}
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <figure className="w-[100px] h-[100px] rounded-full border-2 border-solid border-primaryColor overflow-hidden">
                        <img
                          src={profilePhoto || userData.photo || defaultAvatar}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      </figure>
                      <div className="absolute bottom-0 right-0 bg-white rounded-full p-2 cursor-pointer shadow-md">
                        <label htmlFor="customFile" className={`cursor-pointer ${loading ? 'opacity-50' : ''}`}>
                          {loading ? (
                            <svg className="animate-spin h-5 w-5 text-primaryColor" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primaryColor" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          )}
                        </label>
                        <input
                          type="file"
                          name="photo"
                          id="customFile"
                          onChange={handleFileInputChange}
                          accept="image/*"
                          className="hidden"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <h3 className="text-[18px] leading-[30px] text-headingColor font-bold">
                      {userData.name}
                    </h3>
                    <p className="text-textColor text-[15px] leading-6 font-medium">
                      {userData.email}
                    </p>
                    <p className="text-textColor text-[15px] leading-6 font-medium">
                      Blood Type:
                      <span className="ml-2 text-headingColor text-[22px] leading-8">
                        {userData.bloodType}
                      </span>
                    </p>
                  </div>
      
                  {/* Logout and delete account buttons */}
                  <div className="mt-[50px] md:mt-[100px]">
                    <button
                      onClick={handleLogout}
                      className="w-full bg-[#181A1E] p-3 text-[16px] leading-7 rounded-md text-white"
                    >
                      Logout
                    </button>
                    <button className="w-full bg-red-600 mt-4 p-3 text-[16px] leading-7 rounded-md text-white">
                      Delete account
                    </button>
                  </div>
                </div>
      
                {/* Right column */}
                <div className="md:col-span-2 md:px-[30px]">
                  {/* Tab buttons */}
                  <div>
                    <button
                      onClick={() => setTab("bookings")}
                      className={`${
                        tab === "bookings"
                          ? "bg-primaryColor text-white font-normal"
                          : ""
                      } p-2 mr-5 px-5 rounded-md text-headingColor font-semibold text-[16px] leading-7 border border-solid border-primaryColor`}
                    >
                      My Bookings
                    </button>
      
                    <button
                      onClick={() => setTab("settings")}
                      className={`${
                        tab === "settings"
                          ? "bg-primaryColor text-white font-normal"
                          : ""
                      } py-2 px-5 rounded-md text-headingColor font-semibold text-[16px] leading-7 border border-solid border-primaryColor`}
                    >
                      Profile Settings
                    </button>
                  </div>
      
                  {/* Render content based on tab */}
                  {tab === "bookings" && <MyBookings />}
                  {tab === "settings" && <Profile user={userData} />}
                </div>
              </div>
            )}
          </div>
        </section>
      );
    };
export default MyAccount;