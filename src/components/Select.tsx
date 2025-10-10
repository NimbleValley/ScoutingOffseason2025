const formatValue = (str: string) => {
    const result = str.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
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
                            <option value={String(value)} key={String(value)} > {typeof value == 'string' ? formatValue(value) : String(value)} </option>
                        );
                    })
                }
            </select>
        </div>
    );
}