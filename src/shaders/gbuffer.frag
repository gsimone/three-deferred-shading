precision highp float;
precision highp int;

layout(location = 0) out vec4 gAlbedo;
layout(location = 1) out vec4 gNormal;
layout(location = 2) out vec4 gPosition;
layout(location = 3) out vec4 gMaterial;


uniform vec2 repeat;
uniform vec3 tColor;
uniform int materialId;

in vec3 vInstanceColor;
in vec3 Normal;
in vec3 FragPos;

void main() {

  #ifdef INSTANCED
    // write color to GBuffer
    gAlbedo = vec4(vInstanceColor, 1.);
  #else
    gAlbedo = vec4(tColor, 1.);
  #endif

  // write normals to GBuffer
  gNormal = vec4( normalize( Normal ), 1. );

	// write world to G
	gPosition = vec4( FragPos, 1. );

	gMaterial.r = float(materialId) / 256.;
  gMaterial.g = 0.;
  gMaterial.b = 0.;
  gMaterial.a = 1.;

}