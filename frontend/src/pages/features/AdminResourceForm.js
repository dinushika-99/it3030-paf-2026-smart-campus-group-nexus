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
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  MapPin, 
  Clock, 
  Info, 
  Calendar,
  Users,
  Building2,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
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
  const [activeSection, setActiveSection] = useState("basic");

  useEffect(() => {
    if (!isEdit || !id) return;

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
    if (!form.capacity || parseInt(form.capacity, 10) < 1) {
      newErrors.capacity = "Capacity must be at least 1";
    }

    if (!form.dailyOpenTime) newErrors.dailyOpenTime = "Open time is required";
    if (!form.dailyCloseTime) newErrors.dailyCloseTime = "Close time is required";
    if (form.dailyOpenTime && form.dailyCloseTime && form.dailyOpenTime >= form.dailyCloseTime) {
      newErrors.dailyCloseTime = "Close time must be after open time";
    }

    if (form.isIndoor) {
      if (!form.building.trim()) newErrors.building = "Building is required for indoor resources";
      if (!form.floor) newErrors.floor = "Floor is required for indoor resources";
      if (!form.roomNumber.trim()) newErrors.roomNumber = "Room number is required for indoor resources";
    } else if (!form.areaName.trim()) {
      newErrors.areaName = "Area name is required for outdoor resources";
    }

    if (form.maxBookingDurationHours && parseInt(form.maxBookingDurationHours, 10) <= 0) {
      newErrors.maxBookingDurationHours = "Must be greater than 0";
    }

    if (form.maxQuantity && parseInt(form.maxQuantity, 10) <= 0) {
      newErrors.maxQuantity = "Must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      const firstError = Object.keys(errors)[0];
      const element = document.getElementById(firstError);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
      toast.error("Please fix the errors before submitting");
      return;
    }

    setLoading(true);

    const payload = {
      name: form.name.trim(),
      type: form.type,
      category: form.category,
      capacity: parseInt(form.capacity, 10),
      status: form.status,
      dailyOpenTime: form.dailyOpenTime + ":00",
      dailyCloseTime: form.dailyCloseTime + ":00",
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      isBookable: form.isBookable,
      building: form.isIndoor ? form.building.trim() : null,
      floor: form.isIndoor && form.floor ? parseInt(form.floor, 10) : null,
      roomNumber: form.isIndoor ? form.roomNumber.trim() : null,
      areaName: !form.isIndoor ? form.areaName.trim() : null,
      maxBookingDurationHours: form.maxBookingDurationHours
        ? parseInt(form.maxBookingDurationHours, 10)
        : null,
      maxQuantity: form.maxQuantity ? parseInt(form.maxQuantity, 10) : null,
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

  const sections = [
    { id: "basic", label: "Basic Info", icon: Info },
    { id: "availability", label: "Availability", icon: Clock },
    { id: "location", label: "Location", icon: MapPin },
  ];

  if (fetching) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12">
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
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <Link to="/admin">
              <Button 
                variant="ghost" 
                className="mb-4 text-gray-600 hover:text-[#1B2A4A] hover:bg-gray-100 transition-all duration-200 group"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Button>
            </Link>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1B2A4A] to-[#2A3F6E] bg-clip-text text-transparent">
                  {isEdit ? "Edit Resource" : "Create New Resource"}
                </h1>
                <p className="text-gray-500 mt-2">
                  {isEdit 
                    ? "Update the resource details below" 
                    : "Fill in the details to add a new resource to the system"}
                </p>
              </div>
              {!isEdit && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">New Resource</span>
                </div>
              )}
            </div>
          </div>

          {/* Section Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 ${
                    activeSection === section.id
                      ? "border-[#C5961A] text-[#C5961A]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            {activeSection === "basic" && (
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#C5961A] to-[#E8B53A]" />
                <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white">
                  <CardTitle className="flex items-center gap-2 text-xl text-[#1B2A4A]">
                    <Info className="w-5 h-5 text-[#C5961A]" />
                    Basic Information
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Essential details about the resource</p>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      Resource Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="e.g. Main Lecture Hall A, Chemistry Lab, Tennis Court"
                      className={`mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-[#C5961A]/20 ${
                        errors.name ? "border-red-400 focus:ring-red-200" : "border-gray-200"
                      }`}
                    />
                    {errors.name && (
                      <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                        <AlertCircle className="w-3 h-3" /> {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">
                        Category <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.category}
                        onValueChange={(val) => {
                          updateField("category", val);
                          updateField("type", "");
                        }}
                      >
                        <SelectTrigger 
                          className={`mt-1.5 transition-all duration-200 ${
                            errors.category ? "border-red-400" : "border-gray-200"
                          }`}
                        >
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              <span className="flex items-center gap-2">
                                {cat === "ACADEMIC" && "📚"}
                                {cat === "SPORTS" && "⚽"}
                                {cat === "CULTURAL" && "🎭"}
                                {cat === "ADMINISTRATIVE" && "🏛️"}
                                {formatCategory(cat)}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                          <AlertCircle className="w-3 h-3" /> {errors.category}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-gray-700">
                        Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.type}
                        onValueChange={(val) => updateField("type", val)}
                        disabled={!form.category}
                      >
                        <SelectTrigger 
                          className={`mt-1.5 transition-all duration-200 ${
                            errors.type ? "border-red-400" : "border-gray-200"
                          } ${!form.category ? "bg-gray-50" : ""}`}
                        >
                          <SelectValue 
                            placeholder={form.category ? "Select a type" : "Select category first"} 
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTypes.map((t) => (
                            <SelectItem key={t} value={t}>
                              {formatType(t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.type && (
                        <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                          <AlertCircle className="w-3 h-3" /> {errors.type}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="capacity" className="text-sm font-semibold text-gray-700">
                        <Users className="w-3 h-3 inline mr-1" /> Capacity <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        value={form.capacity}
                        onChange={(e) => updateField("capacity", e.target.value)}
                        placeholder="Number of people"
                        className={`mt-1.5 transition-all duration-200 ${
                          errors.capacity ? "border-red-400" : "border-gray-200"
                        }`}
                      />
                      {errors.capacity && (
                        <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                          <AlertCircle className="w-3 h-3" /> {errors.capacity}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Status</Label>
                      <Select value={form.status} onValueChange={(val) => updateField("status", val)}>
                        <SelectTrigger className="mt-1.5 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              Active
                            </span>
                          </SelectItem>
                          <SelectItem value="OUT_OF_SERVICE">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full" />
                              Out of Service
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="Describe the resource, its features, amenities, and any special notes..."
                      rows={4}
                      className="mt-1.5 border-gray-200 focus:ring-2 focus:ring-[#C5961A]/20 resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="imageUrl" className="text-sm font-semibold text-gray-700">
                      <ImageIcon className="w-3 h-3 inline mr-1" /> Image URL
                    </Label>
                    <Input
                      id="imageUrl"
                      value={form.imageUrl}
                      onChange={(e) => updateField("imageUrl", e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="mt-1.5 border-gray-200"
                    />
                    <p className="text-xs text-gray-400 mt-1">Optional: Add a URL for the resource image</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Availability Section */}
            {activeSection === "availability" && (
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#C5961A] to-[#E8B53A]" />
                <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white">
                  <CardTitle className="flex items-center gap-2 text-xl text-[#1B2A4A]">
                    <Clock className="w-5 h-5 text-[#C5961A]" />
                    Availability & Booking Rules
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Configure when and how this resource can be booked</p>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="dailyOpenTime" className="text-sm font-semibold text-gray-700">
                        Opening Time <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dailyOpenTime"
                        type="time"
                        value={form.dailyOpenTime}
                        onChange={(e) => updateField("dailyOpenTime", e.target.value)}
                        className={`mt-1.5 transition-all duration-200 ${
                          errors.dailyOpenTime ? "border-red-400" : "border-gray-200"
                        }`}
                      />
                      {errors.dailyOpenTime && (
                        <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                          <AlertCircle className="w-3 h-3" /> {errors.dailyOpenTime}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="dailyCloseTime" className="text-sm font-semibold text-gray-700">
                        Closing Time <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dailyCloseTime"
                        type="time"
                        value={form.dailyCloseTime}
                        onChange={(e) => updateField("dailyCloseTime", e.target.value)}
                        className={`mt-1.5 transition-all duration-200 ${
                          errors.dailyCloseTime ? "border-red-400" : "border-gray-200"
                        }`}
                      />
                      {errors.dailyCloseTime && (
                        <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                          <AlertCircle className="w-3 h-3" /> {errors.dailyCloseTime}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <Label htmlFor="isBookable" className="cursor-pointer text-sm font-semibold text-gray-700">
                        Allow Bookings
                      </Label>
                      <p className="text-xs text-gray-500 mt-0.5">Enable or disable booking for this resource</p>
                    </div>
                    <Switch
                      id="isBookable"
                      checked={form.isBookable}
                      onCheckedChange={(val) => updateField("isBookable", val)}
                      className="data-[state=checked]:bg-[#C5961A]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="maxBookingDurationHours" className="text-sm font-semibold text-gray-700">
                        <Calendar className="w-3 h-3 inline mr-1" /> Max Booking Duration
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          id="maxBookingDurationHours"
                          type="number"
                          min="1"
                          value={form.maxBookingDurationHours}
                          onChange={(e) => updateField("maxBookingDurationHours", e.target.value)}
                          placeholder="Hours"
                          className={`pr-16 ${
                            errors.maxBookingDurationHours ? "border-red-400" : "border-gray-200"
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">hours</span>
                      </div>
                      {errors.maxBookingDurationHours && (
                        <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                          <AlertCircle className="w-3 h-3" /> {errors.maxBookingDurationHours}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="maxQuantity" className="text-sm font-semibold text-gray-700">
                        Max Quantity
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          id="maxQuantity"
                          type="number"
                          min="1"
                          value={form.maxQuantity}
                          onChange={(e) => updateField("maxQuantity", e.target.value)}
                          placeholder="Available units"
                          className={`pr-16 ${
                            errors.maxQuantity ? "border-red-400" : "border-gray-200"
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">units</span>
                      </div>
                      {errors.maxQuantity && (
                        <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                          <AlertCircle className="w-3 h-3" /> {errors.maxQuantity}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Section */}
            {activeSection === "location" && (
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#C5961A] to-[#E8B53A]" />
                <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white">
                  <CardTitle className="flex items-center gap-2 text-xl text-[#1B2A4A]">
                    <MapPin className="w-5 h-5 text-[#C5961A]" />
                    Location Details
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Specify where this resource is located</p>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <Label htmlFor="isIndoor" className="cursor-pointer text-sm font-semibold text-gray-700">
                        <Building2 className="w-3 h-3 inline mr-1" /> Indoor Resource
                      </Label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {form.isIndoor
                          ? "Located inside a building (requires building, floor, room)"
                          : "Located outdoors (requires area name)"}
                      </p>
                    </div>
                    <Switch
                      id="isIndoor"
                      checked={form.isIndoor}
                      onCheckedChange={(val) => updateField("isIndoor", val)}
                      className="data-[state=checked]:bg-[#C5961A]"
                    />
                  </div>

                  {form.isIndoor ? (
                    <div className="space-y-4 animate-in slide-in-from-left duration-300">
                      <div>
                        <Label htmlFor="building" className="text-sm font-semibold text-gray-700">
                          Building Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="building"
                          value={form.building}
                          onChange={(e) => updateField("building", e.target.value)}
                          placeholder="e.g. Engineering Block, Science Tower"
                          className={`mt-1.5 ${
                            errors.building ? "border-red-400" : "border-gray-200"
                          }`}
                        />
                        {errors.building && (
                          <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                            <AlertCircle className="w-3 h-3" /> {errors.building}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <Label htmlFor="floor" className="text-sm font-semibold text-gray-700">
                            Floor Number <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="floor"
                            type="number"
                            value={form.floor}
                            onChange={(e) => updateField("floor", e.target.value)}
                            placeholder="e.g. 2"
                            className={`mt-1.5 ${
                              errors.floor ? "border-red-400" : "border-gray-200"
                            }`}
                          />
                          {errors.floor && (
                            <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                              <AlertCircle className="w-3 h-3" /> {errors.floor}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="roomNumber" className="text-sm font-semibold text-gray-700">
                            Room Number <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="roomNumber"
                            value={form.roomNumber}
                            onChange={(e) => updateField("roomNumber", e.target.value)}
                            placeholder="e.g. 201A, B12"
                            className={`mt-1.5 ${
                              errors.roomNumber ? "border-red-400" : "border-gray-200"
                            }`}
                          />
                          {errors.roomNumber && (
                            <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                              <AlertCircle className="w-3 h-3" /> {errors.roomNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in slide-in-from-right duration-300">
                      <Label htmlFor="areaName" className="text-sm font-semibold text-gray-700">
                        Area Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="areaName"
                        value={form.areaName}
                        onChange={(e) => updateField("areaName", e.target.value)}
                        placeholder="e.g. Main Sports Ground, Central Courtyard"
                        className={`mt-1.5 ${
                          errors.areaName ? "border-red-400" : "border-gray-200"
                        }`}
                      />
                      {errors.areaName && (
                        <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                          <AlertCircle className="w-3 h-3" /> {errors.areaName}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex items-center gap-3 justify-end pt-6 border-t border-gray-200">
              <Link to="/admin">
                <Button 
                  variant="outline" 
                  type="button"
                  className="px-6 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#C5961A] to-[#E8B53A] hover:from-[#B08518] hover:to-[#D4A020] text-white min-w-[160px] shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
      </div>
    </Layout>
  );
}