import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileSearch,
  ImagePlus,
  Lock,
  PackagePlus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {
  CAMPUS_LOCATIONS,
  CustodyStatus,
  ITEM_CATEGORIES,
  ITEM_COLORS,
  ItemReport,
  ReportType,
  ScreenRoute,
} from '../types/campusfind';

interface ReportFormProps {
  mode: ReportType;
  onBack: () => void;
  onSubmitReport: (payload: {
    reportType: ReportType;
    title: string;
    category: string;
    color: string;
    brand?: string;
    description: string;
    generalLocation: string;
    specificArea?: string;
    dateOccurred: string;
    approximateTime?: string;
    imageReference?: string;
    custodyStatus?: CustodyStatus;
    preferredContactMethod?: 'IN_APP' | 'CAMPUS_EMAIL' | 'SECURITY_DESK';
    privateIdentifyingDetails?: string;
  }) => Promise<ItemReport>;
  onNavigate: (screen: ScreenRoute) => void;
  onSelectReport: (report: ItemReport) => void;
}

/**
 * Compress and resize uploaded image on the client (max 800px dimension, JPEG 0.78 quality)
 * so mobile uploads stay fast and lightweight.
 */
async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      reject(new Error('Unsupported file format. Please upload a JPG, PNG, or WebP image.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image file is too large (maximum 5MB before compression).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file content.'));
      img.onload = () => {
        const maxDim = 800;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const ReportFormPage: React.FC<ReportFormProps> = ({
  mode,
  onBack,
  onSubmitReport,
  onNavigate,
  onSelectReport,
}) => {
  const isLost = mode === ReportType.LOST;
  const todayStr = new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [generalLocation, setGeneralLocation] = useState<string>('');
  const [specificArea, setSpecificArea] = useState('');
  const [dateOccurred, setDateOccurred] = useState(todayStr);
  const [approximateTime, setApproximateTime] = useState('');
  const [privateIdentifyingDetails, setPrivateIdentifyingDetails] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState<
    'IN_APP' | 'CAMPUS_EMAIL' | 'SECURITY_DESK'
  >('IN_APP');
  const [custodyStatus, setCustodyStatus] = useState<CustodyStatus>(
    isLost ? CustodyStatus.OWNER_LOST : CustodyStatus.HANDED_TO_SECURITY
  );
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdReport, setCreatedReport] = useState<ItemReport | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFieldErrors((prev) => ({ ...prev, photo: '' }));
    try {
      const compressedDataUrl = await compressImageFile(file);
      setImagePreview(compressedDataUrl);
    } catch (err: any) {
      setFieldErrors((prev) => ({
        ...prev,
        photo: err.message || 'Could not process image.',
      }));
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 3) {
      errors.title = 'Please enter an item name (at least 3 characters).';
    }
    if (!category) {
      errors.category = 'Please select an item category.';
    }
    if (!color) {
      errors.color = 'Please select the primary color.';
    }
    if (!description.trim() || description.trim().length < 10) {
      errors.description =
        'Please provide a general public description (at least 10 characters).';
    }
    if (!generalLocation) {
      errors.generalLocation = 'Please select the campus location.';
    }
    if (!dateOccurred) {
      errors.dateOccurred = `Please specify the date the item was ${
        isLost ? 'lost' : 'found'
      }.`;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await onSubmitReport({
        reportType: mode,
        title: title.trim(),
        category,
        color,
        brand: brand.trim() || undefined,
        description: description.trim(),
        generalLocation,
        specificArea: specificArea.trim() || undefined,
        dateOccurred,
        approximateTime: approximateTime || undefined,
        imageReference: imagePreview,
        custodyStatus: isLost ? CustodyStatus.OWNER_LOST : custodyStatus,
        preferredContactMethod,
        privateIdentifyingDetails: privateIdentifyingDetails.trim() || undefined,
      });
      setCreatedReport(report);
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while saving your report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdReport) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-[#15803D]/10 text-[#15803D] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <div className="text-xs font-mono font-semibold text-[#15803D]">
              REPORT SAVED · ID: {createdReport.id}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              {isLost ? 'Lost Item Report Registered' : 'Found Item Report Registered'}
            </h1>
            <p className="text-sm text-slate-600 mt-1.5">
              Your report for <strong>{createdReport.title}</strong> ({createdReport.generalLocation}) has been saved to the persistence layer and indexed by the Smart Potential-Match Engine.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-900">
              Summary of Recorded Details
            </div>
            <div>
              Report Identifier: <span className="font-mono font-semibold">{createdReport.id}</span>
            </div>
            <div>
              Category &amp; Color: {createdReport.category} · {createdReport.color}
            </div>
            <div>
              Location &amp; Date: {createdReport.generalLocation} on {createdReport.dateOccurred}
            </div>
            <div>
              Privacy Protection: Private verification details are stored securely and hidden from public search results.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSelectReport(createdReport)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-xs sm:text-sm font-semibold hover:bg-[#0F172A] transition-colors"
            >
              View Report &amp; Potential Matches
            </button>
            <button
              type="button"
              onClick={() => onNavigate('matches')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs sm:text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Open Match Engine
            </button>
            <button
              type="button"
              onClick={() => onNavigate('student-dashboard')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Go to My Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <button
        type="button"
        onClick={onBack}
        className="min-h-[44px] inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="text-xs font-semibold text-[#2563EB]">
              {isLost ? 'Campus Recovery Intake' : 'Safe Finder Intake'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-1">
              {isLost ? 'Report a Lost Item' : 'Report a Found Item'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {isLost
                ? 'Provide accurate public attributes for matching, and keep unique ownership proof in the private verification field.'
                : 'Log a found belonging without exposing your personal phone number or revealing hidden verification markers publicly.'}
            </p>
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isLost
                ? 'bg-[#B45309]/10 text-[#B45309]'
                : 'bg-[#15803D]/10 text-[#15803D]'
            }`}
          >
            {isLost ? (
              <FileSearch className="w-5 h-5" />
            ) : (
              <PackagePlus className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Switch between Lost and Found mode easily */}
        <div className="mt-5 flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => onNavigate('report-lost')}
            className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              isLost
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lost Item Form
          </button>
          <button
            type="button"
            onClick={() => onNavigate('report-found')}
            className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              !isLost
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Found Item Form
          </button>
        </div>

        {submitError && (
          <div
            role="alert"
            className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-[#B91C1C] flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          {/* Item Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="item-title"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Item Name <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="item-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  isLost
                    ? 'e.g., Black Hydro Flask Water Bottle'
                    : 'e.g., Matte Black Water Bottle'
                }
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
              />
              {fieldErrors.title && (
                <p role="alert" className="text-xs text-[#B91C1C] mt-1">
                  {fieldErrors.title}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="item-category"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Item Category <span className="text-[#B91C1C]">*</span>
              </label>
              <select
                id="item-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
              >
                <option value="">Select a category...</option>
                {ITEM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {fieldErrors.category && (
                <p role="alert" className="text-xs text-[#B91C1C] mt-1">
                  {fieldErrors.category}
                </p>
              )}
            </div>
          </div>

          {/* Color & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="item-color"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Primary Color <span className="text-[#B91C1C]">*</span>
              </label>
              <select
                id="item-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
              >
                <option value="">Select color...</option>
                {ITEM_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {fieldErrors.color && (
                <p role="alert" className="text-xs text-[#B91C1C] mt-1">
                  {fieldErrors.color}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="item-brand"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Brand (Optional)
              </label>
              <input
                id="item-brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Casio, Sony, Hydro Flask, Classmate"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Campus Location & Specific Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="item-location"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                {isLost ? 'Last-Seen Campus Location' : 'Location Where Found'}{' '}
                <span className="text-[#B91C1C]">*</span>
              </label>
              <select
                id="item-location"
                value={generalLocation}
                onChange={(e) => setGeneralLocation(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
              >
                <option value="">Select campus location...</option>
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              {fieldErrors.generalLocation && (
                <p role="alert" className="text-xs text-[#B91C1C] mt-1">
                  {fieldErrors.generalLocation}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="item-area"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Room / Specific Area (Optional)
              </label>
              <input
                id="item-area"
                type="text"
                value={specificArea}
                onChange={(e) => setSpecificArea(e.target.value)}
                placeholder="e.g., 2nd Floor Reading Room, Lab 302"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="item-date"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                {isLost ? 'Date Lost' : 'Date Found'}{' '}
                <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="item-date"
                type="date"
                max={todayStr}
                value={dateOccurred}
                onChange={(e) => setDateOccurred(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
              />
              {fieldErrors.dateOccurred && (
                <p role="alert" className="text-xs text-[#B91C1C] mt-1">
                  {fieldErrors.dateOccurred}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="item-time"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Approximate Time (Optional)
              </label>
              <input
                id="item-time"
                type="time"
                value={approximateTime}
                onChange={(e) => setApproximateTime(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* General Public Description */}
          <div>
            <label
              htmlFor="item-description"
              className="block text-xs font-semibold text-slate-800 mb-1.5"
            >
              General Public Description <span className="text-[#B91C1C]">*</span>
            </label>
            <textarea
              id="item-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isLost
                  ? 'Describe general appearance (size, model, outer material). Keep secret proof markers in the private box below.'
                  : 'Describe the general item found so the owner can recognize it, without giving away secret verification marks.'
              }
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
            />
            {fieldErrors.description && (
              <p role="alert" className="text-xs text-[#B91C1C] mt-1">
                {fieldErrors.description}
              </p>
            )}
          </div>

          {/* FOUND ITEM CUSTODY SELECTION */}
          {!isLost && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="text-xs font-bold text-slate-900">
                Current Item Custody Status <span className="text-[#B91C1C]">*</span>
              </div>
              <p className="text-xs text-slate-600">
                Specify whether you have handed the item to Campus Security or are holding
                it temporarily. Your private contact details are never displayed publicly.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCustodyStatus(CustodyStatus.HANDED_TO_SECURITY)}
                  className={`min-h-[44px] p-3 rounded-xl border text-left text-xs transition-colors ${
                    custodyStatus === CustodyStatus.HANDED_TO_SECURITY
                      ? 'border-[#15803D] bg-[#15803D]/10 text-slate-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Handed to Campus Security Desk
                </button>
                <button
                  type="button"
                  onClick={() => setCustodyStatus(CustodyStatus.HELD_BY_FINDER)}
                  className={`min-h-[44px] p-3 rounded-xl border text-left text-xs transition-colors ${
                    custodyStatus === CustodyStatus.HELD_BY_FINDER
                      ? 'border-[#2563EB] bg-[#2563EB]/10 text-slate-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Currently Held Safely by Finder
                </button>
                <button
                  type="button"
                  onClick={() => setCustodyStatus(CustodyStatus.AWAITING_ADMIN)}
                  className={`min-h-[44px] p-3 rounded-xl border text-left text-xs transition-colors ${
                    custodyStatus === CustodyStatus.AWAITING_ADMIN
                      ? 'border-[#B45309] bg-[#B45309]/10 text-slate-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  At Department / Awaiting Admin Intake
                </button>
              </div>
            </div>
          )}

          {/* PRIVATE IDENTIFYING DETAILS (HIDDEN FROM PUBLIC) */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1E3A8A]">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                Private Identifying Details (Hidden from Public Search)
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {isLost
                ? 'Describe a distinctive scratch, sticker, engraving, key code, or item inside your bag. Only Campus Security administrators see this when verifying claims.'
                : 'Record any hidden detail on the found item (e.g., initials inside cover, keychain tag code, sticker) so administrators can verify rightful claimants.'}
            </p>
            <textarea
              id="private-details"
              rows={2}
              value={privateIdentifyingDetails}
              onChange={(e) => setPrivateIdentifyingDetails(e.target.value)}
              placeholder="e.g., Engraved initials 'A.S.' on back cover, silver club sticker at bottom base (Never shown publicly)"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
            />
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                Never enter passwords, bank PINs, or full government ID numbers.
              </span>
            </div>
          </div>

          {/* PHOTO UPLOAD & PREVIEW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <label
                htmlFor="item-photo"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Item Photo (Optional · JPG/PNG/WebP, auto-compressed)
              </label>
              <label
                htmlFor="item-photo"
                className="min-h-[48px] px-4 py-3 rounded-xl border border-dashed border-slate-300 hover:border-[#2563EB] bg-slate-50 flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer transition-colors"
              >
                <ImagePlus className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>Select or capture photo from phone</span>
                <input
                  id="item-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              {fieldErrors.photo && (
                <p role="alert" className="text-xs text-[#B91C1C] mt-1">
                  {fieldErrors.photo}
                </p>
              )}
              {imagePreview && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={imagePreview}
                    alt="Selected item preview"
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePreview(undefined)}
                    className="text-xs text-[#B91C1C] hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove photo</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="contact-pref"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Preferred Update Channel
              </label>
              <select
                id="contact-pref"
                value={preferredContactMethod}
                onChange={(e) =>
                  setPreferredContactMethod(e.target.value as any)
                }
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
              >
                <option value="IN_APP">In-App Notification Center (Private)</option>
                <option value="SECURITY_DESK">
                  Coordinate via Central Campus Security Desk
                </option>
                <option value="CAMPUS_EMAIL">
                  Verified University Email Relay (No public exposure)
                </option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#0F172A] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              {isSubmitting
                ? 'Saving Report...'
                : isLost
                ? 'Submit Lost Item Report'
                : 'Submit Found Item Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
