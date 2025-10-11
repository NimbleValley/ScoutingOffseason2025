const formatHeader = (str: string) => {
        // Replace underscores with spaces
        let result = str.replace(/_/g, " ");
        // Add space before uppercase letters (optional, in case of camelCase too)
        result = result.replace(/([A-Z])/g, " $1");
        // Capitalize first letter of the string
        result = result.charAt(0).toUpperCase() + result.slice(1);
        // Replace multiple spaces with a single space
        return result.replace(/\s+/g, " ").trim();
    };

export default function CustomSelect({ view, setView, label, options }) {
    return (
        <div className="my-0" >
            <label
                className="mr-2 font-medium text-gray-700"
            >
                {label}
            </label>
            < select
                value={view}
                onChange={(e) => setView(e.target.value)
                }
                className="px-3 py-1 border-2 border-gray-300 rounded hover:shadow-lg hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer transition-shadow-border duration-250"
            >
                {
                    options.map((value: string | number | boolean) => {
                        return (
                            <option value={String(value)} key={String(value)} > {typeof value == 'string' ? formatHeader(value) : String(value)} </option>
                        );
                    })
                }
            </select>
        </div>
    );
}