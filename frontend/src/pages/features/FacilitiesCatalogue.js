import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../AuthContext';

const FacilitiesCatalogue = () => {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // TODO: Fetch facilities from API
    setLoading(false);
    setFacilities([]);
  }, []);

  const filteredFacilities = facilities.filter(facility =>
    facility.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout userRole={user?.role}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Facilities Catalogue</h1>
          <p className="text-gray-600">Browse and explore available facilities</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search facilities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading facilities...</p>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">No facilities found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFacilities.map((facility) => (
              <div key={facility.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{facility.name}</h3>
                <p className="text-gray-600 mb-4">{facility.description}</p>
                <button className="w-full bg-yellow-500 text-black py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors">
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FacilitiesCatalogue;
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Card, CardContent } from "../../components/ui/card";
import {
  Search,
  Users,
  Clock,
  MapPin,
  Filter,
  X,
  Building2,
  Dumbbell,
  Coffee,
  Briefcase,
  Monitor,
} from "lucide-react";
import {
  getAllResources,
  ALL_CATEGORIES,
  CATEGORY_TYPES,
  CATEGORY_IMAGES,
  formatType,
  formatCategory,
  getLocationString,
  formatTime,
} from "../../lib/api";

const CATEGORY_ICONS = {
  ACADEMIC: <Building2 className="w-4 h-4" />,
  SPORTS: <Dumbbell className="w-4 h-4" />,
  COMMON: <Coffee className="w-4 h-4" />,
  ADMINISTRATIVE: <Briefcase className="w-4 h-4" />,
  EQUIPMENT: <Monitor className="w-4 h-4" />,
};

const CATEGORY_COLORS = {
  ACADEMIC: "bg-blue-100 text-blue-800 border-blue-200",
  SPORTS: "bg-green-100 text-green-800 border-green-200",
  COMMON: "bg-purple-100 text-purple-800 border-purple-200",
  ADMINISTRATIVE: "bg-orange-100 text-orange-800 border-orange-200",
  EQUIPMENT: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

export default function FacilitiesCatalogue() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

  async function fetchResources() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllResources();
      setResources(data);
    } catch {
      setError(
        "Unable to connect to the server. Please make sure the backend is running on port 8081."
      );
    } finally {
      setLoading(false);
    }
  }

  const availableTypes = useMemo(() => {
    if (selectedCategory === "ALL") {
      return Object.values(CATEGORY_TYPES).flat();
    }
    return CATEGORY_TYPES[selectedCategory] || [];
  }, [selectedCategory]);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description &&
          r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.building &&
          r.building.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.areaName &&
          r.areaName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "ALL" || r.category === selectedCategory;
      const matchesType = selectedType === "ALL" || r.type === selectedType;
      const matchesStatus =
        selectedStatus === "ALL" || r.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });
  }, [resources, searchQuery, selectedCategory, selectedType, selectedStatus]);

  function clearFilters() {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedType("ALL");
    setSelectedStatus("ALL");
  }

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== "ALL" ||
    selectedType !== "ALL" ||
    selectedStatus !== "ALL";

  function getResourceImage(resource) {
    if (resource.imageUrl) return resource.imageUrl;
    return (
      CATEGORY_IMAGES[resource.category] ||
      "https://mgx-backend-cdn.metadl.com/generate/images/422425/2026-04-21/nbrj2xaaaflq/hero-campus-facilities.png"
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[280px] overflow-hidden">
        <img
          src="https://mgx-backend-cdn.metadl.com/generate/images/422425/2026-04-21/nbrj2xaaaflq/hero-campus-facilities.png"
          alt="Campus Facilities"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1B2A4A]/85 to-[#1B2A4A]/50" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Facilities &amp; Assets Catalogue
            </h1>
            <p className="text-white/80 text-lg max-w-xl">
              Browse and discover campus resources — lecture halls, labs, sports
              facilities, meeting rooms, and equipment.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search facilities by name, type, building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "border-[#C5961A] text-[#C5961A]" : ""}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 rounded-full bg-[#C5961A]" />
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-gray-500"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-1.5 block">
                  Category
                </label>
                <Select
                  value={selectedCategory}
                  onValueChange={(val) => {
                    setSelectedCategory(val);
                    setSelectedType("ALL");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {ALL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {formatCategory(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-1.5 block">
                  Type
                </label>
                <Select
                  value={selectedType}
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    {availableTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {formatType(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-1.5 block">
                  Status
                </label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Category Quick Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedCategory("ALL");
              setSelectedType("ALL");
            }}
            className={
              selectedCategory === "ALL"
                ? "bg-[#1B2A4A] hover:bg-[#152238] text-white"
                : ""
            }
          >
            All
          </Button>
          {ALL_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedType("ALL");
              }}
              className={
                selectedCategory === cat
                  ? "bg-[#1B2A4A] hover:bg-[#152238] text-white"
                  : ""
              }
            >
              {CATEGORY_ICONS[cat]}
              <span className="ml-1.5">{formatCategory(cat)}</span>
            </Button>
          ))}
        </div>
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-12">
        {/* Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading
              ? "Loading..."
              : `${filteredResources.length} resource${filteredResources.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium mb-2">Connection Error</p>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <Button
              onClick={fetchResources}
              className="bg-[#1B2A4A] hover:bg-[#152238] text-white"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse"
              >
                <div className="h-40 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredResources.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No resources found</p>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your search or filters
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Resource Cards Grid */}
        {!loading && !error && filteredResources.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Link
                key={resource.resourcesId}
                to={`/resources/${resource.resourcesId}`}
              >
                <Card className="overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={getResourceImage(resource)}
                      alt={resource.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <Badge
                        className={`text-xs border ${CATEGORY_COLORS[resource.category] || "bg-gray-100 text-gray-800"}`}
                      >
                        {CATEGORY_ICONS[resource.category]}
                        <span className="ml-1">
                          {formatCategory(resource.category)}
                        </span>
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge
                        className={`text-xs ${
                          resource.status === "ACTIVE"
                            ? "bg-green-500 text-white border-green-500"
                            : "bg-red-500 text-white border-red-500"
                        }`}
                      >
                        {resource.status === "ACTIVE" ? "Active" : "Out of Service"}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* Name & Type */}
                    <h3 className="font-semibold text-[#1B2A4A] text-base mb-1 line-clamp-1">
                      {resource.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {formatType(resource.type)}
                    </p>

                    {/* Info Row */}
                    <div className="flex flex-col gap-1.5 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>Capacity: {resource.capacity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {formatTime(resource.dailyOpenTime)} –{" "}
                          {formatTime(resource.dailyCloseTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="line-clamp-1">
                          {getLocationString(resource)}
                        </span>
                      </div>
                    </div>

                    {/* Bookable badge */}
                    {resource.isBookable && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <Badge
                          variant="outline"
                          className="text-[#C5961A] border-[#C5961A]/30 bg-[#C5961A]/5 text-xs"
                        >
                          Bookable
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
