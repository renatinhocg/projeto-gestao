const imgElipse6 = "https://www.figma.com/api/mcp/asset/a505f819-6172-406e-b05b-26416bf0b5df";
const imgElipse5 = "https://www.figma.com/api/mcp/asset/1dcdbac4-ae44-42e5-87df-5b6ef9cdc588";
const imgEllipse5 = "https://www.figma.com/api/mcp/asset/4d21828a-d0af-45bb-beda-3a86a75a049d";
const imgInfoOutline = "https://www.figma.com/api/mcp/asset/9cb04b13-84b3-4e33-9f36-8e6b9aeea03c";
const imgMoonSolid1 = "https://www.figma.com/api/mcp/asset/1d20f020-af3e-4935-9eb0-c550f7198b03";
const imgNotificationsNone = "https://www.figma.com/api/mcp/asset/733af4a0-bbf5-4b21-b912-64f29713c18f";
const imgSearchIcon = "https://www.figma.com/api/mcp/asset/7151cd49-e804-4aef-8c07-a5b8c42c5b6a";

export default function Misc() {
  return (
    <div className="contents relative size-full" data-name="Misc" data-node-id="201:2093">
      <div className="absolute bg-white h-[61px] left-[1476px] rounded-[30px] shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] top-[65px] w-[422px]" data-node-id="201:2094" />
      <div className="absolute left-[1846px] size-[41px] top-[75px]" data-name="Avatar Style 6" data-node-id="201:2874">
        <div className="absolute contents inset-0" data-name="Avatar" data-node-id="201:2875">
          <div className="absolute inset-[-10%_-1.43%_-30%_-10%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[4.1px_4.1px] mask-size-[41px_41px]" data-name="Elipse 5" data-node-id="201:2877" style={{ maskImage: `url('${imgElipse5}')` }}>
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgElipse6} />
          </div>
          <div className="absolute inset-0 mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_0px] mask-size-[41px_41px]" data-node-id="201:2878" style={{ maskImage: `url('${imgElipse5}')` }}>
            <img alt="" className="block max-w-none size-full" src={imgEllipse5} />
          </div>
        </div>
      </div>
      <div className="absolute left-[1802px] size-[24px] top-[83px]" data-name="info_outline" data-node-id="201:2879">
        <img alt="" className="block max-w-none size-full" src={imgInfoOutline} />
      </div>
      <div className="absolute left-[1764px] size-[18px] top-[86px]" data-name="moon-solid 1" data-node-id="201:2097">
        <img alt="" className="block max-w-none size-full" src={imgMoonSolid1} />
      </div>
      <div className="absolute left-[1720px] size-[24px] top-[83px]" data-name="notifications_none" data-node-id="201:2884">
        <img alt="" className="block max-w-none size-full" src={imgNotificationsNone} />
      </div>
      <div className="absolute h-[41px] left-[1486px] top-[75px] w-[214px]" data-name="Large Input" data-node-id="201:2887">
        <div className="absolute contents inset-0" data-name="Background" data-node-id="201:2888">
          <div className="absolute bg-[#f4f7fe] inset-0 rounded-[49px]" data-node-id="201:2889" />
        </div>
        <div className="absolute contents left-[42px] top-[calc(50%+0.5px)] translate-y-[-50%]" data-name="Text" data-node-id="201:2890">
          <p className="absolute font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] left-[42px] text-[#8f9bba] text-[14px] top-[calc(50%+-9.5px)] tracking-[-0.28px]" data-node-id="201:2891" style={{ fontVariationSettings: "'opsz' 14" }}>
            Search
          </p>
        </div>
        <div className="absolute left-[20px] size-[11px] top-1/2 translate-y-[-50%]" data-name="Search Icon" data-node-id="201:2892">
          <div className="absolute bottom-[-6.36%] left-0 right-0 top-0">
            <img alt="" className="block max-w-none size-full" src={imgSearchIcon} />
          </div>
        </div>
      </div>
    </div>
  );
}SUPER CRITICAL: The generated React+Tailwind code MUST be converted to match the target project's technology stack and styling system.
1. Analyze the target codebase to identify: technology stack, styling approach, component patterns, and design tokens
2. Convert React syntax to the target framework/library
3. Transform all Tailwind classes to the target styling system while preserving exact visual design
4. Follow the project's existing patterns and conventions
DO NOT install any Tailwind as a dependency unless the user instructs you to do so.
Node ids have been added to the code as data attributes, e.g. `data-node-id="1:2"`.Images and SVGs will be stored as constants, e.g. const image = 'https://www.figma.com/api/mcp/asset/550e8400-e29b-41d4-a716-446655440000'. These constants will be used in the code as the source for the image, ex: <img src={image} />. Image assets are stored on a remote server for 7 days and can be fetched using the provided URLs until they expire.IMPORTANT: After you call this tool, you MUST call get_screenshot to get a screenshot of the node for context.