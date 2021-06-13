in vec3 position;
in vec2 uv;

out vec2 TexCoords;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main() {

	TexCoords = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}