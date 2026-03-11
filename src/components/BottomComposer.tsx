import type { ComponentProps } from "react";
import { InputBar } from "./InputBar";
import { PermissionPrompt } from "./PermissionPrompt";

type InputBarProps = ComponentProps<typeof InputBar>;
type PermissionPromptProps = ComponentProps<typeof PermissionPrompt>;

interface BottomComposerProps extends InputBarProps {
  pendingPermission: PermissionPromptProps["request"] | null;
  onRespondPermission: PermissionPromptProps["onRespond"];
}

export function BottomComposer({
  pendingPermission,
  onRespondPermission,
  ...inputBarProps
}: BottomComposerProps) {
  return (
    <>
      {pendingPermission ? (
        <PermissionPrompt
          key={pendingPermission.requestId}
          request={pendingPermission}
          onRespond={onRespondPermission}
        />
      ) : null}
      <InputBar {...inputBarProps} />
    </>
  );
}
