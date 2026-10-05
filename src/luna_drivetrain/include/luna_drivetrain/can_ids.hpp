#ifndef LUNA_DRIVETRAIN__CAN_IDS_HPP_
#define LUNA_DRIVETRAIN__CAN_IDS_HPP_

namespace luna_drivetrain
{

// CAN IDs of the drive motor controllers, as set in Phoenix Tuner. The right
// side IDs are placeholders; the bench test only uses the left side.
constexpr int kTalonLeftCanId = 2;
constexpr int kVictorLeftCanId = 1;
constexpr int kTalonRightCanId = 0;
constexpr int kVictorRightCanId = 0;

}  // namespace luna_drivetrain

#endif  // LUNA_DRIVETRAIN__CAN_IDS_HPP_
