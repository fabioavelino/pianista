export default function ImageSelector({setCurrentImage}) {
  const loadFile = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.addEventListener("load", (event) => {
      setCurrentImage(event.target.result);
    });
    reader.readAsDataURL(file);
  };

  return (
    <label className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-full text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
       htmlFor="file-selector">
    <input
      className="hidden"
      onChange={loadFile}
      type="file"
      id="file-selector"
      accept=".jpg, .jpeg, .png"
    />
      <p>Select piano sheet</p>
    </label>
  );
}
