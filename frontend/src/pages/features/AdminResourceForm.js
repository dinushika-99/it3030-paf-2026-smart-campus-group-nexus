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
        navigate("/admin", { state: { activeTab: "scheduling" } });
      })
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

  const availableTypes = form.category ? CATEGORY_TYPES[form.category] || [] : [];
  const cardClass = "border border-[#D5E0F4] shadow-sm bg-gradient-to-b from-[#F3F8FF] to-[#F8FBFF]";
  const cardHeaderClass = "pb-4 border-b border-[#DFE9F8]";
  const labelClass = "text-slate-700 font-medium";
  const sectionHintClass = "text-sm text-slate-500";
  const sectionInputClass =
    "bg-[#EDF3FE] border-[#D3DEF2] text-slate-700 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#C5961A]/30 focus-visible:border-[#C5961A]";

  function getFieldClass(error) {
    return `${sectionInputClass} ${error ? "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-200" : ""}`.trim();
  }

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
    if (!validate()) return;

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
      navigate("/admin", { state: { activeTab: "scheduling" } });
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
      <Layout hideHeader>
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
    <Layout hideHeader>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#ECF3FF] rounded-2xl">
        <Link to="/admin" state={{ activeTab: "scheduling" }}>
          <Button variant="ghost" className="mb-4 text-slate-600 hover:text-[#1B2A4A] hover:bg-[#D9E7FC]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <h1 className="text-2xl font-bold text-[#1B2A4A] mb-6">
          {isEdit ? "Edit Resource" : "Add New Resource"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 items-start">
          <Card className={cardClass}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className="text-lg text-[#1B2A4A]">Basic Information</CardTitle>
              <p className={sectionHintClass}>Set core details and identity of the resource.</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div>
                <Label htmlFor="name" className={labelClass}>
                  Resource Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Main Lecture Hall A"
                  className={getFieldClass(errors.name)}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.category}
                    onValueChange={(val) => {
                      updateField("category", val);
                      updateField("type", "");
                    }}
                  >
                    <SelectTrigger className={getFieldClass(errors.category)}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {formatCategory(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>

                <div>
                  <Label className={labelClass}>
                    Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.type}
                    onValueChange={(val) => updateField("type", val)}
                    disabled={!form.category}
                  >
                    <SelectTrigger className={getFieldClass(errors.type)}>
                      <SelectValue placeholder={form.category ? "Select type" : "Select category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {formatType(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity" className={labelClass}>
                    Capacity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) => updateField("capacity", e.target.value)}
                    placeholder="e.g. 100"
                    className={getFieldClass(errors.capacity)}
                  />
                  {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                </div>

                <div>
                  <Label className={labelClass}>Status</Label>
                  <Select value={form.status} onValueChange={(val) => updateField("status", val)}>
                    <SelectTrigger className={sectionInputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className={labelClass}>Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe the resource..."
                  rows={3}
                  className={sectionInputClass}
                />
              </div>

              <div>
                <Label htmlFor="imageUrl" className={labelClass}>Image URL</Label>
                <Input
                  id="imageUrl"
                  value={form.imageUrl}
                  onChange={(e) => updateField("imageUrl", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={sectionInputClass}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={cardClass}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className="text-lg text-[#1B2A4A]">Availability &amp; Booking</CardTitle>
              <p className={sectionHintClass}>Define opening hours and booking limits.</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dailyOpenTime" className={labelClass}>
                    Daily Open Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dailyOpenTime"
                    type="time"
                    value={form.dailyOpenTime}
                    onChange={(e) => updateField("dailyOpenTime", e.target.value)}
                    className={getFieldClass(errors.dailyOpenTime)}
                  />
                  {errors.dailyOpenTime && (
                    <p className="text-red-500 text-xs mt-1">{errors.dailyOpenTime}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dailyCloseTime" className={labelClass}>
                    Daily Close Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dailyCloseTime"
                    type="time"
                    value={form.dailyCloseTime}
                    onChange={(e) => updateField("dailyCloseTime", e.target.value)}
                    className={getFieldClass(errors.dailyCloseTime)}
                  />
                  {errors.dailyCloseTime && (
                    <p className="text-red-500 text-xs mt-1">{errors.dailyCloseTime}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-[#D3DEF2] bg-[#EDF4FF] px-4 py-3">
                <div>
                  <Label htmlFor="isBookable" className={`${labelClass} cursor-pointer`}>
                    Is Bookable
                  </Label>
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
                  <Label htmlFor="maxBookingDurationHours" className={labelClass}>Max Booking Duration (hours)</Label>
                  <Input
                    id="maxBookingDurationHours"
                    type="number"
                    min="1"
                    value={form.maxBookingDurationHours}
                    onChange={(e) => updateField("maxBookingDurationHours", e.target.value)}
                    placeholder="e.g. 4"
                    className={getFieldClass(errors.maxBookingDurationHours)}
                  />
                  {errors.maxBookingDurationHours && (
                    <p className="text-red-500 text-xs mt-1">{errors.maxBookingDurationHours}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="maxQuantity" className={labelClass}>Max Quantity</Label>
                  <Input
                    id="maxQuantity"
                    type="number"
                    min="1"
                    value={form.maxQuantity}
                    onChange={(e) => updateField("maxQuantity", e.target.value)}
                    placeholder="e.g. 10"
                    className={getFieldClass(errors.maxQuantity)}
                  />
                  {errors.maxQuantity && (
                    <p className="text-red-500 text-xs mt-1">{errors.maxQuantity}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className="text-lg text-[#1B2A4A]">Location</CardTitle>
              <p className={sectionHintClass}>Set where the resource can be found.</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="flex items-center justify-between rounded-lg border border-[#D3DEF2] bg-[#EDF4FF] px-4 py-3">
                <div>
                  <Label htmlFor="isIndoor" className={`${labelClass} cursor-pointer`}>
                    Indoor Resource
                  </Label>
                  <p className="text-xs text-gray-500">
                    {form.isIndoor
                      ? "Located inside a building (building, floor, room)"
                      : "Located outdoors (area name)"}
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
                    <Label htmlFor="building" className={labelClass}>
                      Building <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="building"
                      value={form.building}
                      onChange={(e) => updateField("building", e.target.value)}
                      placeholder="e.g. Engineering Block"
                      className={getFieldClass(errors.building)}
                    />
                    {errors.building && <p className="text-red-500 text-xs mt-1">{errors.building}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="floor" className={labelClass}>
                        Floor <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="floor"
                        type="number"
                        value={form.floor}
                        onChange={(e) => updateField("floor", e.target.value)}
                        placeholder="e.g. 2"
                        className={getFieldClass(errors.floor)}
                      />
                      {errors.floor && <p className="text-red-500 text-xs mt-1">{errors.floor}</p>}
                    </div>

                    <div>
                      <Label htmlFor="roomNumber" className={labelClass}>
                        Room Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="roomNumber"
                        value={form.roomNumber}
                        onChange={(e) => updateField("roomNumber", e.target.value)}
                        placeholder="e.g. 201A"
                        className={getFieldClass(errors.roomNumber)}
                      />
                      {errors.roomNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.roomNumber}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="areaName" className={labelClass}>
                    Area Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="areaName"
                    value={form.areaName}
                    onChange={(e) => updateField("areaName", e.target.value)}
                    placeholder="e.g. Main Sports Ground"
                    className={getFieldClass(errors.areaName)}
                  />
                  {errors.areaName && <p className="text-red-500 text-xs mt-1">{errors.areaName}</p>}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <Link to="/admin" state={{ activeTab: "scheduling" }}>
              <Button
                variant="outline"
                type="button"
                className="border-[#B9C8E2] text-slate-700 hover:bg-[#DFEAFC]"
              >
                Cancel
              </Button>
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
