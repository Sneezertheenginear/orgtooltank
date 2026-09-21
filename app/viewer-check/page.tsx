import Vehicle360Viewer from "../Vehicle360Viewer";
export default function Check() {
  return <main style={{maxWidth:600,margin:'40px auto'}}><h1>Temporary interaction test — non-vehicle fixtures</h1><Vehicle360Viewer label="Test fixtures" width={600} height={300} frames={[{src:'/file.svg',alt:'File fixture'},{src:'/globe.svg',alt:'Globe fixture'},{src:'/window.svg',alt:'Window fixture'}]} /></main>;
}
