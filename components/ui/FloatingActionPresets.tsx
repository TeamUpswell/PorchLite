"use client";

import { Plus, Save, ArrowLeft, Edit, Trash2, Eye, Download, Upload, Settings } from "lucide-react";
import FloatingActionButton from "./FloatingActionButton";
import FloatingActionContainer from "./FloatingActionContainer";

interface CreatePatternProps {
  href?: string;
  onClick?: () => void;
  label?: string;
}

export function CreatePattern({ href, onClick, label = "Create" }: CreatePatternProps) {
  return (
    <FloatingActionContainer>
      <FloatingActionButton
        icon={Plus}
        label={label}
        href={href}
        onClick={onClick}
        variant="primary"
      />
    </FloatingActionContainer>
  );
}

interface EditPatternProps {
  onSave?: () => void;
  onBack?: () => void;
  backHref?: string;
  saveLabel?: string;
  backLabel?: string;
  saving?: boolean;
  disabled?: boolean;
  form?: string;
}

export function EditPattern({
  onSave,
  onBack,
  backHref,
  saveLabel = "Save Changes",
  backLabel = "Back",
  saving = false,
  disabled = false,
  form,
}: EditPatternProps) {
  return (
    <FloatingActionContainer>
      <FloatingActionButton
        icon={Save}
        label={saveLabel}
        onClick={onSave}
        variant="success"
        loading={saving}
        disabled={disabled}
        type={form ? "submit" : "button"}
        form={form}
      />
      {(onBack || backHref) && (
        <FloatingActionButton
          icon={ArrowLeft}
          label={backLabel}
          onClick={onBack}
          href={backHref}
          variant="gray"
        />
      )}
    </FloatingActionContainer>
  );
}

interface DetailPatternProps {
  editHref?: string;
  backHref?: string;
  onEdit?: () => void;
  onBack?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  backLabel?: string;
  showDelete?: boolean;
}

export function DetailPattern({
  editHref,
  backHref,
  onEdit,
  onBack,
  onDelete,
  editLabel = "Edit",
  backLabel = "Back",
  showDelete = false,
}: DetailPatternProps) {
  return (
    <FloatingActionContainer>
      {(editHref || onEdit) && (
        <FloatingActionButton
          icon={Edit}
          label={editLabel}
          href={editHref}
          onClick={onEdit}
          variant="warning"
        />
      )}
      {showDelete && onDelete && (
        <FloatingActionButton
          icon={Trash2}
          label="Delete"
          onClick={onDelete}
          variant="danger"
        />
      )}
      {(backHref || onBack) && (
        <FloatingActionButton
          icon={ArrowLeft}
          label={backLabel}
          href={backHref}
          onClick={onBack}
          variant="gray"
        />
      )}
    </FloatingActionContainer>
  );
}

interface MultiActionPatternProps {
  actions: Array<{
    icon: any;
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "gray";
    disabled?: boolean;
    loading?: boolean;
    type?: "button" | "submit";
    form?: string;
  }>;
}

export function MultiActionPattern({ actions }: MultiActionPatternProps) {
  return (
    <FloatingActionContainer>
      {actions.map((action, index) => (
        <FloatingActionButton
          key={index}
          icon={action.icon}
          label={action.label}
          onClick={action.onClick}
          href={action.href}
          variant={action.variant || "primary"}
          disabled={action.disabled}
          loading={action.loading}
          type={action.type}
          form={action.form}
        />
      ))}
    </FloatingActionContainer>
  );
}