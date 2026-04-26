import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  ArrowLeft, //this is a test comment
  Users,
  Clock,
  MapPin,
  CalendarCheck,
  Info,
  Building2,
  Layers,
  DoorOpen,
  TreePine,
  Timer,
  Package,
} from "lucide-react";
import {
  getResourceById,
  CATEGORY_IMAGES,
  formatType,
  formatCategory,
  formatTime,
  getLocationString,
  getResourceBookedSlots,
} from "../../lib/api";

const CATEGORY_COLORS = {
  ACADEMIC: "bg-blue-100 text-blue-800 border-blue-200",
  SPORTS: "bg-green-100 text-green-800 border-green-200",
  COMMON: "bg-purple-100 text-purple-800 border-purple-200",
  ADMINISTRATIVE: "bg-orange-100 text-orange-800 border-orange-200",
  EQUIPMENT: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const resourceIdForBooking = resource?.resourcesId ?? resource?.id ?? id;
  const canCreateBooking =
    Boolean(resource?.isBookable) && String(resource?.status || "").toUpperCase() === "ACTIVE";

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getResourceById(Number(id))
      .then(setResource)
      .catch(() => setError("Failed to load resource details."))
      .finally(() => setLoading(false));
  }, [id]);

  const loadBookedSlots = useCallback(() => {
    if (!resourceIdForBooking) return Promise.resolve();
    setSlotsLoading(true);
    setSlotsError(null);

    return getResourceBookedSlots(resourceIdForBooking)
      .then((slots) => setBookedSlots(Array.isArray(slots) ? slots : []))
      .catch(() => {
        setBookedSlots([]);
        setSlotsError("Failed to load booked time slots.");
      })
      .finally(() => setSlotsLoading(false));
  }, [resourceIdForBooking]);

  useEffect(() => {
    if (!resourceIdForBooking) return;

    loadBookedSlots();

    const intervalId = window.setInterval(() => {
      loadBookedSlots();
    }, 30000);

    const onFocus = () => loadBookedSlots();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [resourceIdForBooking, loadBookedSlots]);

  function formatSlotDateTime(value) {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getSlotStatusClass(status) {
    if (status === "APPROVED") return "bg-green-100 text-green-800 border-green-200";
    if (status === "PENDING") return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  }

  function getImage() {
    if (resource?.imageUrl) return resource.imageUrl;
    return (
      CATEGORY_IMAGES[resource?.category || "COMMON"] ||
      "https://mgx-backend-cdn.metadl.com/generate/images/422425/2026-04-21/nbrj2xaaaflq/hero-campus-facilities.png"
    );
  }

  const resourceId = resource?.resourcesId ?? resource?.id;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded-xl" />
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded w-2/3" />
              <div className="h-5 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !resource) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-red-500 font-medium mb-4">{error || "Resource not found"}</p>
          <Button onClick={() => navigate("/facilities")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Facilities
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button onClick={() => navigate("/facilities")} variant="ghost" className="mb-4 text-gray-600">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Facilities
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="relative rounded-xl overflow-hidden h-[300px] mb-6">
              <img src={getImage()} alt={resource.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 flex gap-2">
                <Badge className={`border ${CATEGORY_COLORS[resource.category] || "bg-gray-100 text-gray-800"}`}>
                  {formatCategory(resource.category)}
                </Badge>
                <Badge
                  className={
                    resource.status === "ACTIVE"
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-red-500 text-white border-red-500"
                  }
                >
                  {resource.status === "ACTIVE" ? "Active" : "Out of Service"}
                </Badge>
                {resource.isBookable && (
                  <Badge className="bg-[#C5961A] text-white border-[#C5961A]">Bookable</Badge>
                )}
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-[#1B2A4A] mb-1">{resource.name}</h1>
            <p className="text-gray-500 text-lg mb-6">{formatType(resource.type)}</p>

            {resource.description && (
              <Card className="mb-6 border border-gray-100">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-[#C5961A] mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-[#1B2A4A] mb-1">Description</h3>
                      <p className="text-gray-600 leading-relaxed">{resource.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="border border-gray-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Capacity</p>
                    <p className="text-[#1B2A4A] font-semibold">
                      {resource.capacity} {resource.capacity === 1 ? "person" : "people"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Availability</p>
                    <p className="text-[#1B2A4A] font-semibold">
                      {formatTime(resource.dailyOpenTime)} - {formatTime(resource.dailyCloseTime)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Location</p>
                    <p className="text-[#1B2A4A] font-semibold">{getLocationString(resource)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Bookable</p>
                    <p className="text-[#1B2A4A] font-semibold">{resource.isBookable ? "Yes" : "No"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6 border border-gray-100">
              <CardContent className="p-5">
                <h3 className="font-semibold text-[#1B2A4A] mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#C5961A]" />
                  Location Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {resource.building && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Building:</span>
                      <span className="text-[#1B2A4A] font-medium">{resource.building}</span>
                    </div>
                  )}
                  {resource.floor !== null && resource.floor !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Layers className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Floor:</span>
                      <span className="text-[#1B2A4A] font-medium">{resource.floor}</span>
                    </div>
                  )}
                  {resource.roomNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <DoorOpen className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Room Number:</span>
                      <span className="text-[#1B2A4A] font-medium">{resource.roomNumber}</span>
                    </div>
                  )}
                  {resource.areaName && (
                    <div className="flex items-center gap-2 text-sm">
                      <TreePine className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Area Name:</span>
                      <span className="text-[#1B2A4A] font-medium">{resource.areaName}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {(resource.maxBookingDurationHours || resource.maxQuantity) && (
              <Card className="mb-6 border border-gray-100">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-[#1B2A4A] mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#C5961A]" />
                    Booking Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resource.maxBookingDurationHours && (
                      <div className="flex items-center gap-2 text-sm">
                        <Timer className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Max Duration:</span>
                        <span className="text-[#1B2A4A] font-medium">
                          {resource.maxBookingDurationHours} hour{resource.maxBookingDurationHours > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    {resource.maxQuantity && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Max Quantity:</span>
                        <span className="text-[#1B2A4A] font-medium">{resource.maxQuantity}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {resource.isBookable && resource.status === "ACTIVE" && resourceId && (
              <Button
                className="bg-[#C5961A] hover:bg-[#B08518] text-white"
                onClick={() => navigate(`/bookings/new/${resourceId}`)}
              >
                Book This Resource
              </Button>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="border border-gray-100 lg:sticky lg:top-24">
              <CardContent className="p-5">
                <h3 className="font-semibold text-[#1B2A4A] mb-1">Already Booked Time Slots</h3>
                <p className="text-sm text-gray-500 mb-4">Check occupied times before creating your booking.</p>

                <Button
                  type="button"
                  variant="outline"
                  className="mb-4 w-full"
                  onClick={loadBookedSlots}
                  disabled={slotsLoading}
                >
                  {slotsLoading ? "Refreshing..." : "Refresh Slots"}
                </Button>

                {slotsLoading && <p className="text-sm text-gray-500">Loading booked slots...</p>}

                {!slotsLoading && slotsError && (
                  <p className="text-sm text-red-500">{slotsError}</p>
                )}

                {!slotsLoading && !slotsError && bookedSlots.length === 0 && (
                  <p className="text-sm text-gray-500">No booked slots yet.</p>
                )}

                {!slotsLoading && !slotsError && bookedSlots.length > 0 && (
                  <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                    {bookedSlots.map((slot) => (
                      <div key={slot.bookingId} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-[#1B2A4A] leading-snug">
                            {formatSlotDateTime(slot.startTime)}
                          </p>
                          <Badge className={`border text-xs ${getSlotStatusClass(slot.status)}`}>
                            {slot.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">to {formatSlotDateTime(slot.endTime)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
