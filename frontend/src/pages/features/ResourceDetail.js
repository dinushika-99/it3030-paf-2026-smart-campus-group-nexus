import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  ArrowLeft,
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
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-28 -left-20 h-72 w-72 rounded-full bg-[#E6ECFF] blur-3xl" />
        <div className="pointer-events-none absolute top-40 -right-24 h-80 w-80 rounded-full bg-[#ECE8FF] blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            onClick={() => navigate("/facilities")}
            variant="ghost"
            className="mb-5 rounded-xl text-slate-600 hover:text-[#1B2A4A] hover:bg-[#E9EEFF]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Facilities
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2 overflow-hidden border border-[#DEE6F8] rounded-3xl shadow-sm bg-white/90 backdrop-blur-sm">
              <div className="relative h-[290px] sm:h-[330px]">
                <img src={getImage()} alt={resource.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/55 via-[#0f172a]/12 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="flex flex-wrap gap-2 mb-3">
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
                  <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{resource.name}</h1>
                  <p className="text-white/85 text-base mt-1">{formatType(resource.type)}</p>
                </div>
              </div>

              {resource.description && (
                <CardContent className="p-5 border-t border-[#EEF3FF]">
                  <div className="flex items-start gap-3 rounded-2xl bg-[#F6F8FF] p-4 border border-[#E9EEFA]">
                    <Info className="w-5 h-5 text-[#6D73E0] mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-[#1B2A4A] mb-1">Description</h3>
                      <p className="text-slate-600 leading-relaxed">{resource.description}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="border border-[#DEE6F8] rounded-3xl shadow-sm bg-white/90 backdrop-blur-sm">
              <CardContent className="p-5">
                <h3 className="font-semibold text-[#1B2A4A] mb-4">Quick Snapshot</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#E3EAF9] bg-[#F8FAFF] p-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E8EEFF] flex items-center justify-center mb-2">
                      <Users className="w-4 h-4 text-[#5267D6]" />
                    </div>
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Capacity</p>
                    <p className="text-[#1B2A4A] font-semibold text-sm mt-0.5">{resource.capacity}</p>
                  </div>

                  <div className="rounded-2xl border border-[#E3EAF9] bg-[#F8FAFF] p-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E9F7EF] flex items-center justify-center mb-2">
                      <CalendarCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Bookable</p>
                    <p className="text-[#1B2A4A] font-semibold text-sm mt-0.5">{resource.isBookable ? "Yes" : "No"}</p>
                  </div>

                  <div className="col-span-2 rounded-2xl border border-[#E3EAF9] bg-[#F8FAFF] p-3">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF0FF] flex items-center justify-center mb-2">
                      <Clock className="w-4 h-4 text-[#626EE0]" />
                    </div>
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Availability</p>
                    <p className="text-[#1B2A4A] font-semibold text-sm mt-0.5">
                      {formatTime(resource.dailyOpenTime)} - {formatTime(resource.dailyCloseTime)}
                    </p>
                  </div>
                </div>

                {canCreateBooking && resourceIdForBooking && (
                  <Button
                    className="mt-5 w-full rounded-xl bg-[#C59A2F] hover:bg-[#AF8828] text-[#111827]"
                    onClick={() => navigate(`/bookings/new/${resourceIdForBooking}`)}
                  >
                    Book This Resource
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-[#DEE6F8] rounded-3xl shadow-sm bg-white/90 backdrop-blur-sm">
              <CardContent className="p-5">
                <h3 className="font-semibold text-[#1B2A4A] mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#6D73E0]" />
                  Location Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {resource.building && (
                    <div className="flex items-center gap-2 text-sm rounded-xl border border-[#E8EEFA] bg-[#F8FAFF] p-3">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Building:</span>
                      <span className="text-[#1B2A4A] font-medium">{resource.building}</span>
                    </div>
                  )}
                  {resource.floor !== null && resource.floor !== undefined && (
                    <div className="flex items-center gap-2 text-sm rounded-xl border border-[#E8EEFA] bg-[#F8FAFF] p-3">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Floor:</span>
                      <span className="text-[#1B2A4A] font-medium">{resource.floor}</span>
                    </div>
                  )}
                  {resource.roomNumber && (
                    <div className="flex items-center gap-2 text-sm rounded-xl border border-[#E8EEFA] bg-[#F8FAFF] p-3">
                      <DoorOpen className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Room:</span>
                      <span className="text-[#1B2A4A] font-medium">{resource.roomNumber}</span>
                    </div>
                  )}
                  {resource.areaName && (
                    <div className="flex items-center gap-2 text-sm rounded-xl border border-[#E8EEFA] bg-[#F8FAFF] p-3">
                      <TreePine className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Area:</span>
                      <span className="text-[#1B2A4A] font-medium">{resource.areaName}</span>
                    </div>
                  )}
                  <div className="sm:col-span-2 flex items-center gap-2 text-sm rounded-xl border border-[#E8EEFA] bg-[#F8FAFF] p-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">Address:</span>
                    <span className="text-[#1B2A4A] font-medium">{getLocationString(resource)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(resource.maxBookingDurationHours || resource.maxQuantity) ? (
              <Card className="border border-[#DEE6F8] rounded-3xl shadow-sm bg-white/90 backdrop-blur-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-[#1B2A4A] mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#6D73E0]" />
                    Booking Details
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {resource.maxBookingDurationHours && (
                      <div className="flex items-center gap-2 text-sm rounded-xl border border-[#E8EEFA] bg-[#F8FAFF] p-3">
                        <Timer className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500">Max Duration:</span>
                        <span className="text-[#1B2A4A] font-medium">
                          {resource.maxBookingDurationHours} hour{resource.maxBookingDurationHours > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    {resource.maxQuantity && (
                      <div className="flex items-center gap-2 text-sm rounded-xl border border-[#E8EEFA] bg-[#F8FAFF] p-3">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500">Max Quantity:</span>
                        <span className="text-[#1B2A4A] font-medium">{resource.maxQuantity}</span>
                      </div>
                    )}
                    {!canCreateBooking && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        This resource cannot be booked right now.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-[#DEE6F8] rounded-3xl shadow-sm bg-white/90 backdrop-blur-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-[#1B2A4A] mb-2">Booking Details</h3>
                  <p className="text-slate-500 text-sm">No additional booking limits set for this resource.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
