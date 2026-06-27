"use client";

import { Modal } from "@/components/ui/modal";
import { UploadImage } from "@/components/ui/upload-image";

export function ImageLightbox({
  src,
  alt = "",
  open,
  onClose,
}: {
  src: string | null;
  alt?: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!src) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={null}
      className="max-w-[min(96vw,56rem)] overflow-hidden border-0 bg-black/90 p-0 shadow-none"
    >
      <UploadImage
        src={src}
        alt={alt}
        className="mx-auto block max-h-[85vh] w-full object-contain"
      />
    </Modal>
  );
}
