import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../AuthContext';

const AdminResourceForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    capacity: '',
    description: '',
    isBookable: true,
  });
  const [loading, setLoading] = useState(id ? true : false);
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode) {
      // TODO: Fetch resource data from API
      setLoading(false);
      setFormData({
        name: '',
        type: '',
        location: '',
        capacity: '',
        description: '',
        isBookable: true,
      });
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // TODO: Submit form data to API
      alert(`Resource ${isEditMode ? 'updated' : 'created'} successfully!`);
      navigate('/admin/resources');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading resource...</p>
          </div>
        </div>
      </DashboardLayout>
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createResource,
  updateResource,
  getResourceById,
  ALL_CATEGORIES,
  CATEGORY_TYPES,
  formatType,
  formatCategory,
} from "../../lib/api";

const initialFormData = {
  name: "",
  type: "",
  category: "",
  capacity: "",
  status: "ACTIVE",
  dailyOpenTime: "08:00",
  dailyCloseTime: "18:00",
  description: "",
  imageUrl: "",
  isBookable: true,
  isIndoor: true,
  building: "",
  floor: "",
  roomNumber: "",
  areaName: "",
  maxBookingDurationHours: "",
  maxQuantity: "",
};

export default function AdminResourceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && id) {
      setFetching(true);
      getResourceById(Number(id))
        .then((resource) => {
          const hasBuilding = resource.building !== null && resource.building !== "";
          setForm({
            name: resource.name || "",
            type: resource.type || "",
            category: resource.category || "",
            capacity: resource.capacity?.toString() || "",
            status: resource.status || "ACTIVE",
            dailyOpenTime: resource.dailyOpenTime ? resource.dailyOpenTime.substring(0, 5) : "08:00",
            dailyCloseTime: resource.dailyCloseTime ? resource.dailyCloseTime.substring(0, 5) : "18:00",
            description: resource.description || "",
            imageUrl: resource.imageUrl || "",
            isBookable: resource.isBookable ?? true,
            isIndoor: hasBuilding,
            building: resource.building || "",
            floor: resource.floor?.toString() || "",
            roomNumber: resource.roomNumber || "",
            areaName: resource.areaName || "",
            maxBookingDurationHours: resource.maxBookingDurationHours?.toString() || "",
            maxQuantity: resource.maxQuantity?.toString() || "",
          });
        })
        .catch(() => {
          toast.error("Failed to load resource");
          navigate("/admin");
        })
        .finally(() => setFetching(false));
    }
  }, [id, isEdit, navigate]);

  const availableTypes = form.category ? CATEGORY_TYPES[form.category] || [] : [];

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.category) newErrors.category = "Category is required";
    if (!form.type) newErrors.type = "Type is required";
    if (!form.capacity || parseInt(form.capacity) < 1)
      newErrors.capacity = "Capacity must be at least 1";
    if (!form.dailyOpenTime) newErrors.dailyOpenTime = "Open time is required";
    if (!form.dailyCloseTime) newErrors.dailyCloseTime = "Close time is required";
    if (form.dailyOpenTime && form.dailyCloseTime) {
      if (form.dailyOpenTime >= form.dailyCloseTime) {
        newErrors.dailyCloseTime = "Close time must be after open time";
      }
    }

    if (form.isIndoor) {
      if (!form.building.trim()) newErrors.building = "Building is required for indoor resources";
      if (!form.floor) newErrors.floor = "Floor is required for indoor resources";
      if (!form.roomNumber.trim()) newErrors.roomNumber = "Room number is required for indoor resources";
    } else {
      if (!form.areaName.trim()) newErrors.areaName = "Area name is required for outdoor resources";
    }

    if (form.maxBookingDurationHours && parseInt(form.maxBookingDurationHours) <= 0) {
      newErrors.maxBookingDurationHours = "Must be greater than 0";
    }

    if (form.maxQuantity && parseInt(form.maxQuantity) <= 0) {
      newErrors.maxQuantity = "Must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const payload = {
      name: form.name.trim(),
      type: form.type,
      category: form.category,
      capacity: parseInt(form.capacity),
      status: form.status,
      dailyOpenTime: form.dailyOpenTime + ":00",
      dailyCloseTime: form.dailyCloseTime + ":00",
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      isBookable: form.isBookable,
      building: form.isIndoor ? form.building.trim() : null,
      floor: form.isIndoor && form.floor ? parseInt(form.floor) : null,
      roomNumber: form.isIndoor ? form.roomNumber.trim() : null,
      areaName: !form.isIndoor ? form.areaName.trim() : null,
      maxBookingDurationHours: form.maxBookingDurationHours ? parseInt(form.maxBookingDurationHours) : null,
      maxQuantity: form.maxQuantity ? parseInt(form.maxQuantity) : null,
    };

    try {
      if (isEdit && id) {
        await updateResource(Number(id), payload);
        toast.success("Resource updated successfully");
      } else {
        await createResource(payload);
        toast.success("Resource created successfully");
      }
      navigate("/admin");
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to save resource. Make sure you are logged in as admin.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <DashboardLayout userRole={user?.role}>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? 'Edit Resource' : 'Create Resource'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? 'Update the resource information' : 'Add a new resource to the system'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
              Resource Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="e.g., Lab A, Meeting Room 201"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="type" className="block text-sm font-semibold text-gray-900 mb-2">
                Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Select a type</option>
                <option value="LAB">Lab</option>
                <option value="CLASSROOM">Classroom</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="AUDITORIUM">Auditorium</option>
                <option value="GYM">Gym</option>
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-gray-900 mb-2">
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., Building A, 2nd Floor"
              />
            </div>
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-semibold text-gray-900 mb-2">
              Capacity
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="e.g., 50"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Provide additional details about the resource"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isBookable"
              name="isBookable"
              checked={formData.isBookable}
              onChange={handleChange}
              className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-2 focus:ring-yellow-500"
            />
            <label htmlFor="isBookable" className="ml-3 text-sm font-semibold text-gray-900">
              Make this resource bookable
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-yellow-500 text-black py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditMode ? 'Update Resource' : 'Create Resource'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/resources')}
              className="flex-1 bg-gray-300 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AdminResourceForm;
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/admin">
          <Button variant="ghost" className="mb-4 text-gray-600 hover:text-[#1B2A4A]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <h1 className="text-2xl font-bold text-[#1B2A4A] mb-6">
          {isEdit ? "Edit Resource" : "Add New Resource"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="border border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-[#1B2A4A]">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Resource Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Main Lecture Hall A"
                  className={errors.name ? "border-red-400" : ""}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Category <span className="text-red-500">*</span></Label>
                  <Select
                    value={form.category}
                    onValueChange={(val) => { updateField("category", val); updateField("type", ""); }}
                  >
                    <SelectTrigger className={errors.category ? "border-red-400" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{formatCategory(cat)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>
                <div>
                  <Label>Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={form.type}
                    onValueChange={(val) => updateField("type", val)}
                    disabled={!form.category}
                  >
                    <SelectTrigger className={errors.type ? "border-red-400" : ""}>
                      <SelectValue placeholder={form.category ? "Select type" : "Select category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTypes.map((t) => (
                        <SelectItem key={t} value={t}>{formatType(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacity <span className="text-red-500">*</span></Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) => updateField("capacity", e.target.value)}
                    placeholder="e.g. 100"
                    className={errors.capacity ? "border-red-400" : ""}
                  />
                  {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(val) => updateField("status", val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe the resource..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={form.imageUrl}
                  onChange={(e) => updateField("imageUrl", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card className="border border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-[#1B2A4A]">Availability &amp; Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dailyOpenTime">Daily Open Time <span className="text-red-500">*</span></Label>
                  <Input
                    id="dailyOpenTime"
                    type="time"
                    value={form.dailyOpenTime}
                    onChange={(e) => updateField("dailyOpenTime", e.target.value)}
                    className={errors.dailyOpenTime ? "border-red-400" : ""}
                  />
                  {errors.dailyOpenTime && <p className="text-red-500 text-xs mt-1">{errors.dailyOpenTime}</p>}
                </div>
                <div>
                  <Label htmlFor="dailyCloseTime">Daily Close Time <span className="text-red-500">*</span></Label>
                  <Input
                    id="dailyCloseTime"
                    type="time"
                    value={form.dailyCloseTime}
                    onChange={(e) => updateField("dailyCloseTime", e.target.value)}
                    className={errors.dailyCloseTime ? "border-red-400" : ""}
                  />
                  {errors.dailyCloseTime && <p className="text-red-500 text-xs mt-1">{errors.dailyCloseTime}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="isBookable" className="cursor-pointer">Is Bookable</Label>
                  <p className="text-xs text-gray-500">Allow users to book this resource</p>
                </div>
                <Switch
                  id="isBookable"
                  checked={form.isBookable}
                  onCheckedChange={(val) => updateField("isBookable", val)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxBookingDurationHours">Max Booking Duration (hours)</Label>
                  <Input
                    id="maxBookingDurationHours"
                    type="number"
                    min="1"
                    value={form.maxBookingDurationHours}
                    onChange={(e) => updateField("maxBookingDurationHours", e.target.value)}
                    placeholder="e.g. 4"
                    className={errors.maxBookingDurationHours ? "border-red-400" : ""}
                  />
                  {errors.maxBookingDurationHours && <p className="text-red-500 text-xs mt-1">{errors.maxBookingDurationHours}</p>}
                </div>
                <div>
                  <Label htmlFor="maxQuantity">Max Quantity</Label>
                  <Input
                    id="maxQuantity"
                    type="number"
                    min="1"
                    value={form.maxQuantity}
                    onChange={(e) => updateField("maxQuantity", e.target.value)}
                    placeholder="e.g. 10"
                    className={errors.maxQuantity ? "border-red-400" : ""}
                  />
                  {errors.maxQuantity && <p className="text-red-500 text-xs mt-1">{errors.maxQuantity}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="border border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-[#1B2A4A]">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="isIndoor" className="cursor-pointer">Indoor Resource</Label>
                  <p className="text-xs text-gray-500">
                    {form.isIndoor ? "Located inside a building (building, floor, room)" : "Located outdoors (area name)"}
                  </p>
                </div>
                <Switch
                  id="isIndoor"
                  checked={form.isIndoor}
                  onCheckedChange={(val) => updateField("isIndoor", val)}
                />
              </div>

              {form.isIndoor ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="building">Building <span className="text-red-500">*</span></Label>
                    <Input
                      id="building"
                      value={form.building}
                      onChange={(e) => updateField("building", e.target.value)}
                      placeholder="e.g. Engineering Block"
                      className={errors.building ? "border-red-400" : ""}
                    />
                    {errors.building && <p className="text-red-500 text-xs mt-1">{errors.building}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="floor">Floor <span className="text-red-500">*</span></Label>
                      <Input
                        id="floor"
                        type="number"
                        value={form.floor}
                        onChange={(e) => updateField("floor", e.target.value)}
                        placeholder="e.g. 2"
                        className={errors.floor ? "border-red-400" : ""}
                      />
                      {errors.floor && <p className="text-red-500 text-xs mt-1">{errors.floor}</p>}
                    </div>
                    <div>
                      <Label htmlFor="roomNumber">Room Number <span className="text-red-500">*</span></Label>
                      <Input
                        id="roomNumber"
                        value={form.roomNumber}
                        onChange={(e) => updateField("roomNumber", e.target.value)}
                        placeholder="e.g. 201A"
                        className={errors.roomNumber ? "border-red-400" : ""}
                      />
                      {errors.roomNumber && <p className="text-red-500 text-xs mt-1">{errors.roomNumber}</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="areaName">Area Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="areaName"
                    value={form.areaName}
                    onChange={(e) => updateField("areaName", e.target.value)}
                    placeholder="e.g. Main Sports Ground"
                    className={errors.areaName ? "border-red-400" : ""}
                  />
                  {errors.areaName && <p className="text-red-500 text-xs mt-1">{errors.areaName}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center gap-3 justify-end">
            <Link to="/admin">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#C5961A] hover:bg-[#B08518] text-white min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEdit ? "Update Resource" : "Create Resource"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
