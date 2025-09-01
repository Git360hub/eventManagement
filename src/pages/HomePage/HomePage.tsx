import { useRef } from "react";
import useAuthContext from "../../hooks/useAuthContext";
import Button from "../../components/Button/Button";
import { fileStorage } from "../../firebase";
import { ref, uploadBytes } from "firebase/storage";

export default function HomePage() {
  const { user } = useAuthContext();

  const fileInputRef: React.RefObject<HTMLInputElement | null> = useRef(null);

  const onSaveFileHandler = async () => {
    if (fileInputRef.current?.files?.length !== 1) return;

    const file = fileInputRef.current.files[0];
    const fileRef = ref(fileStorage, file.name);
    await uploadBytes(fileRef, file);
  };

  return (
    <div>
      Hello {user!.firstName} {user!.lastName}
      <input ref={fileInputRef} type="file" style={{ display: "none" }} />
      <Button
        onClick={() => {
          fileInputRef.current?.click();
        }}
      >
        Upload a file
      </Button>
      <Button onClick={onSaveFileHandler}>Save File</Button>
    </div>
  );
}
