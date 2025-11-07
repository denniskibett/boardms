"use client";
import React from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useSession } from "next-auth/react";

export default function UserAddressCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { data: session, status } = useSession();
  
  const isLoading = status === "loading";
  const user = session?.user;

  const handleSave = () => {
    // Handle save logic here - you can integrate with your API
    console.log("Saving address changes...");
    closeModal();
  };

  // Default Kenyan government address data
  const defaultAddress = {
    country: "Kenya",
    county: "Nairobi County",
    constituency: "Nairobi Constituency",
    postalCode: "00100",
    building: "Harambee House",
    street: "Harambee Avenue",
    officeLocation: "Floor 4, Room 402",
    phone: "+254-20-2227411",
    employeeId: user?.id ? `GOK-${user.id.toString().padStart(6, '0')}` : "GOK-000000"
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse"></div>
            
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                  <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-auto h-11 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Office Address & Contact
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Country
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {defaultAddress.country}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  County/Constituency
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {defaultAddress.county}, {defaultAddress.constituency}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Postal Code
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {defaultAddress.postalCode}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Employee ID
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 font-mono">
                  {defaultAddress.employeeId}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Office Building
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {defaultAddress.building}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Office Phone
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {defaultAddress.phone}
                </p>
              </div>
            </div>

            {/* Full Address Display */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Complete Office Address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {defaultAddress.building}, {defaultAddress.street},<br />
                {defaultAddress.officeLocation},<br />
                P.O. Box {defaultAddress.postalCode}, {defaultAddress.county}
              </p>
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto transition-colors duration-200"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Update Address
          </button>
        </div>
      </div>

      {/* Edit Address Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[800px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Update Office Address
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your official government office address and contact information.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 pb-3 overflow-y-auto custom-scrollbar max-h-[500px]">
              
              {/* Office Location Section */}
              <div className="mb-8">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Office Location
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Country</Label>
                    <Input 
                      type="text" 
                      defaultValue={defaultAddress.country}
                      placeholder="Country"
                    />
                  </div>

                  <div>
                    <Label>County</Label>
                    <Input 
                      type="text" 
                      defaultValue={defaultAddress.county}
                      placeholder="County"
                    />
                  </div>

                  <div>
                    <Label>Constituency</Label>
                    <Input 
                      type="text" 
                      defaultValue={defaultAddress.constituency}
                      placeholder="Constituency"
                    />
                  </div>

                  <div>
                    <Label>Postal Code</Label>
                    <Input 
                      type="text" 
                      defaultValue={defaultAddress.postalCode}
                      placeholder="Postal Code"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Label>Street Address</Label>
                    <Input 
                      type="text" 
                      defaultValue={defaultAddress.street}
                      placeholder="Street Address"
                    />
                  </div>

                  <div>
                    <Label>Building Name</Label>
                    <Input 
                      type="text" 
                      defaultValue={defaultAddress.building}
                      placeholder="Building Name"
                    />
                  </div>

                  <div>
                    <Label>Office Location</Label>
                    <Input 
                      type="text" 
                      defaultValue={defaultAddress.officeLocation}
                      placeholder="Floor, Room Number"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="mb-8">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Contact Information
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Office Phone</Label>
                    <Input 
                      type="tel" 
                      defaultValue={defaultAddress.phone}
                      placeholder="+254-XX-XXXXXXX"
                    />
                  </div>

                  <div>
                    <Label>Extension</Label>
                    <Input 
                      type="text" 
                      placeholder="Extension number"
                    />
                  </div>

                  <div>
                    <Label>Emergency Contact</Label>
                    <Input 
                      type="tel" 
                      placeholder="Emergency phone number"
                    />
                  </div>

                  <div>
                    <Label>Government Email</Label>
                    <Input 
                      type="email" 
                      defaultValue={user?.email || ''}
                      placeholder="name@ministry.go.ke"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Government Identification Section */}
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Government Identification
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Employee ID</Label>
                    <Input 
                      type="text" 
                      defaultValue={defaultAddress.employeeId}
                      placeholder="GOK-XXXXXX"
                      disabled
                    />
                  </div>

                  <div>
                    <Label>KRA PIN</Label>
                    <Input 
                      type="text" 
                      placeholder="A012345678B"
                    />
                  </div>

                  <div>
                    <Label>National ID Number</Label>
                    <Input 
                      type="text" 
                      placeholder="12345678"
                    />
                  </div>

                  <div>
                    <Label>Passport Number</Label>
                    <Input 
                      type="text" 
                      placeholder="A12345678"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="mt-6">
                <Label>Additional Notes</Label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                  rows={3}
                  placeholder="Any additional address or contact information..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}