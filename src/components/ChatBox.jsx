import { useState } from "react"

export default function ChatBox(){
    const [image, setImage] = useState(null);

    const detectMedicine = async = () => {
        const formData = new FormData();
        formData.append("image", image);

        const res = await fetch("http://localhost:5000/api/medicine/detect", {
            method: "POST",
            body: formData,
        })
    }

    return(
        <>
            <div>
                <h1>AI Medicine Detector</h1>

                <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                />

                <button onClick={detectMedicine} disabled={!image}>Detect Medicine</button>
            </div>
        </>
    )
}