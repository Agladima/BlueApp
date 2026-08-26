import logoLarge from '../../assets/logo (2).png'
import logoSmall from '../../assets/logo (3).png'

export default function Logo({ size = 22 }) {
  const src = size >= 28 ? logoLarge : logoSmall

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable="false"
      style={{ display: 'block', flexShrink: 0 }}
    />
  )
}
